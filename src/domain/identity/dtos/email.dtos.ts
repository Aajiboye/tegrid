export class UserWelcomeEmail {
  to: string;
  subject: string;
  otp: string;
  name: string;
}

export class ForgotPassword {
  to: string;
  subject: string;
  otp: string;
  name: string;
}

export class GroupInviteEmail {
  to: string;
  subject: string;
  inviteLink: string;
  groupName: string;
}
