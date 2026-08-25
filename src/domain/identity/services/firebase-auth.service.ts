import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { HomeOwnerRepository } from '../repositories/user.repo';
import { TokenService } from '../../../shared/services/token.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../enums/roles.enum';

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAuthService.name);

  constructor(
    private readonly userRepo: HomeOwnerRepository,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService
  ) {
    // keep constructor thin; init moved to onModuleInit
  }

  async onModuleInit() {
    // Initialize Firebase Admin once when module initializes
    if (admin.apps.length) {
      this.logger.log('Firebase admin already initialized (skipping)');
      return;
    }

    try {
      const useJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
      if (useJson) {
        this.logger.log('Initializing Firebase Admin SDK from JSON env');
        const svc = JSON.parse(useJson);
        admin.initializeApp({
          credential: admin.credential.cert(svc),
        });
      } else {
        this.logger.log('Initializing Firebase Admin SDK with default credentials');
        admin.initializeApp();
      }
      this.logger.log('Firebase admin initialized');
    } catch (err) {
      this.logger.error('Failed to init Firebase admin', err as any);
      // do not throw here — verification will fail later if not configured
    }
  }

  async signInWithFirebase(idToken: string) {
    if (!idToken) throw new BadRequestException('idToken is required');

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(idToken, true);
    } catch (err) {
      // try without checkRevoked in case token was minted recently
      try {
        decoded = await admin.auth().verifyIdToken(idToken);
      } catch (err2) {
        this.logger.warn('Firebase token verification failed', (err2 as any)?.message);
        throw new BadRequestException('Invalid Authentication token');
      }
    }

    const firebaseUid = decoded.uid;
    const email = decoded.email ?? null;
    const photoURL = decoded.picture ?? null;
    const phoneNumber = decoded.phone_number ?? null;

    // Try find user by firebaseUid then by email
    let user = null;
    try {
      user = firebaseUid ? await this.userRepo.findOne({ firebaseUid }) : null;
      if (!user && email) {
        user = await this.userRepo.findOne({ email });
      }
    } catch (err) {
      this.logger.error('User lookup failed', err as any);
    }

    // Create minimal (partial) user if not found
    if (!user) {
      const partial: any = {
        firebaseUid,
        email,
        userName: email ? email.split('@')[0] : `user_${firebaseUid.substring(0, 8)}`,
        profileAvatar: photoURL ?? undefined,
        phone: phoneNumber ?? undefined,
        isVerified: true,
        role: Role.User,
      };
        user = await this.userRepo.save(partial);
      
    }

    // Issue application JWT

    const payload = {
      email: user.email,
      _id: user._id,
      role: user.role,
      profileAvatar: user.profileAvatar,
      userName: user.userName,
    }
    const token = this.tokenService.generateAccessToken(payload);

    return {
        id: user._id?.toString?.() ?? user.id ?? null,
        email: user.email ?? null,
        token,
        verified: user.isVerified ?? false,
        userName: user.userName ?? null,
        userRole: user.role ?? null,
        profileAvatar: user.profileAvatar ?? null,
    };
  }
}