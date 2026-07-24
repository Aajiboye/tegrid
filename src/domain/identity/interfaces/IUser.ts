import {
  UserNameExistenceResponse,
} from '../dtos/auth.payload.dto';
import { UpdateProfileDto, UserProfileDto } from '../dtos/user.dto';
import { User } from '../models/user.model';
export interface IUser {
  getUserNameAvailability(username:string): Promise<UserNameExistenceResponse>;
  getProfile(user:User): Promise<UserProfileDto>;
  editProfile(payload:UpdateProfileDto, user: User): Promise<UserProfileDto>;
  searchProfile(query:string): Promise<UserProfileDto[]>;
}
