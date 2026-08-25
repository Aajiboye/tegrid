import { SetMetadata } from '@nestjs/common';
import { UserType } from '../domain/identity/enums/user-types.enum';

export const RequireUserType = (userType: UserType) => SetMetadata('userType', userType);
