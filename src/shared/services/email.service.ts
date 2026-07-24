import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

import * as nodemailer from 'nodemailer';

import * as Handlebars from 'handlebars';
import {
  UserWelcomeEmail,
  ForgotPassword,
} from 'src/domain/identity/dtos/email.dtos';
import { existsSync } from 'fs';


@Injectable()
export class EmailService {
  private readonly nodeEnv: string;
  private readonly defaultSender: string;
    private readonly brevoApiKey: string;
  private readonly logger: Logger;
  private readonly smtpUsername: string;


  constructor(private readonly configService: ConfigService) {
    this.nodeEnv = this.configService.getOrThrow<string>('NODE_ENV');
    this.defaultSender = this.configService.getOrThrow<string>(
      'EMAIL_DEFAULT_SENDER',
    );
    this.brevoApiKey =
      this.configService.getOrThrow<string>('BREVO_API_KEY');

    this.logger = new Logger(EmailService.name);
    this.smtpUsername = this.configService.getOrThrow<string>('SMTP_USERNAME');
  }

  async sendEmail(
    to: string | { email: string; name?: string }[],
    subject: string,
    text: string,
    html: string,
  ) {
    try {
      if(this.nodeEnv === 'production') {
        const brevoUrl = 'https://api.brevo.com/v3/smtp/email';
        const apiKey = this.brevoApiKey;

        const extractLocalPart = (email: string) => {
          try {
            return String(email).split('@')[0] || '';
          } catch {
            return '';
          }
        };

        const recipients = Array.isArray(to)
          ? (to as any[]).map((t) => {
              if (typeof t === 'string') {
                return { email: t, name: extractLocalPart(t) };
              }
              const email = t.email ?? t;
              const name = t.name && String(t.name).trim().length ? t.name : extractLocalPart(email);
              return { email, name };
            })
          : [{ email: to as string, name: extractLocalPart(to as string) }];
        const payload = {
          sender: {
            name: this.configService.getOrThrow<string>('EMAIL_DEFAULT_SENDER_NAME'),
            email: this.defaultSender,
          },
          to: recipients,
          subject,
          htmlContent: html,
          textContent: text,
        };
        const res = await fetch(brevoUrl, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify(payload),
        });

        // Try to read Brevo response body for diagnostics; don't log secrets
        let brevoBody = '';
        try {
          brevoBody = await res.text();
        } catch (e) {
          brevoBody = '<failed to read body>';
        }

        if (res.ok) {
          return; // success via Brevo
        }

        // Non-ok response: warn and fall back to SMTP transport below
        this.logger.warn(`Brevo API returned status ${res.status} - falling back to SMTP; response: ${brevoBody}`);
      }   
        const transporter = nodemailer.createTransport({
          host: this.configService.getOrThrow<string>('EMAIL_HOST'),
          port: 587,
          auth: {
            user: this.smtpUsername,
            pass: this.configService.getOrThrow<string>('EMAIL_PASS'),
          },
        });
console.log('SENDING EMAIL TO:', to);
        await transporter.sendMail({
          from: `"${this.configService.getOrThrow<string>('EMAIL_DEFAULT_SENDER_NAME')}" <${this.defaultSender}>`,
          to,
          subject,
          text,
          html,
        });
      
    } catch (error) {
      this.logger.error(`Email couldn't be sent to ${to} due to ${error}`);
      throw new ConflictException(error);
    }
  }

  // async sendEmail(
  //   to: string | string[],
  //   subject: string,
  //   text: string,
  //   html: string,
  // ) {
  //   try {
  //       const transporter = nodemailer.createTransport({
  //         host: this.configService.getOrThrow<string>('EMAIL_HOST'),
  //         port: 587,
  //         auth: {
  //           user: this.configService.getOrThrow<string>('EMAIL_DEFAULT_SENDER'),
  //           pass: this.configService.getOrThrow<string>('EMAIL_PASS'),
  //         },
  //       });

  //       await transporter.sendMail({
  //         from: `"${this.configService.getOrThrow<string>('EMAIL_DEFAULT_SENDER_NAME')}" <${this.defaultSender}>`,
  //         to,
  //         subject,
  //         text,
  //         html,
  //       });
      
  //   } catch (error) {
  //     this.logger.error(`Email couldn't be sent to ${to} due to ${error}`);
  //     throw new ConflictException(error);
  //   }
  // }

  @OnEvent('Send.NewUser')
  async sendNewUserEmail(payload: UserWelcomeEmail) {
    try {
      this.logger.log(`Sending welcome email to ${payload.to}`);
      const emailTemplate = this.resolveTemplatePath('new-user-mail.hbs')
    
      const template = Handlebars.compile(emailTemplate);

      await this.sendEmail(
        payload.to,
        payload.subject,
        emailTemplate,
        template({
          name: payload.name,
          otp: payload.otp,
        }),
      );
      this.logger.log('Mail sent to ' + payload.to);
    } catch (error) {
      this.logger.error(`Mail sending via SMTP server error: ${error} `);
    }
  }

  @OnEvent('Send.NewVendor')
  async sendNewVendorEmail(payload: UserWelcomeEmail) {
    try {
      this.logger.log(`Sending welcome email to ${payload.to}`);
      const emailTemplate = this.resolveTemplatePath(
        'new-vendor-mail.hbs');
    
      const template = Handlebars.compile(emailTemplate);

      await this.sendEmail(
        payload.to,
        payload.subject,
        emailTemplate,
        template({
          name: payload.name,
          otp: payload.otp,
        }),
      );
      this.logger.log('Mail sent to ' + payload.to);
    } catch (error) {
      this.logger.error(`Mail sending via SMTP server error: ${error} `);
    }
  }

  @OnEvent('Send.ForgotPassword')
  async sendForgotPassword(payload: ForgotPassword) {
    try {
      const emailTemplate = this.resolveTemplatePath(
        'forgot-password-mail.hbs');

      const template = Handlebars.compile(emailTemplate);

      await this.sendEmail(
        payload.to,
        payload.subject,
        emailTemplate,
        template({
          name: payload.name,
          otp: payload.otp,
        }),
      );
      this.logger.log('Mail sent to ' + payload.to);
    } catch (error) {
      this.logger.error(`Mail sending via SMTP server error: ${error} `);
    }
  }


  resolveTemplatePath(filename: string): string {
    // Try to find template in dist/views
    const distPath = path.join(__dirname, '..', 'views', 'emails', filename);
    if (existsSync(distPath)) {
      return fs.readFileSync(
        distPath,
        'utf-8',
      );
    }
  
    // Fallback to src/views (for dev mode)
    const srcPath = path.join(process.cwd(), 'views', 'emails', filename);

    return fs.readFileSync(
        srcPath,
        'utf-8',
      );
  }
}
