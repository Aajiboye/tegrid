export enum DatabaseErrorCodes {
  DUPLICATE_ERROR = '23505',
}

export enum ErrorMessages {
  ALREADY_VERIFIED = 'User already verified',
  INVALID_VERIFICATION_CODE = 'Invalid verification code',
  VERIFICATION_REQUIRED = 'Email Verification Required!',
  INVALID_USER = 'Invalid User',
  INAVLID_TOKEN = 'Invalid Token',
  EXPIRED_TOKEN = 'Expired Token',
  INVALID_CREDENTIALS = 'Invalid Login Credentials',
  DUPLICATE_RECORD = 'Record already exist',
  DATABASE_ERROR = 'An Error Occured',
  DATABASE_ERROR_CODE = '230023',
}

export enum PAYMENTSTATUS {
  SUCCESS = 'success',
  PROCESSING = 'processing',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  SUCCESSFUL = 'successful',
}

export enum ErrorCode {
  VALIDATION_ERROR = 1001,
}
