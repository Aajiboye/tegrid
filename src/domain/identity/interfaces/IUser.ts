import {
  UserNameExistenceResponse,
} from '../dtos/auth.payload.dto';
import { UpdateProfileDto, UserProfileDto } from '../dtos/user.dto';
import { HomeOwner } from '../models/home-owner-user.model';
export interface IUser {
  getUserNameAvailability(username:string): Promise<UserNameExistenceResponse>;
  getProfile(user:HomeOwner): Promise<UserProfileDto>;
  editProfile(payload:UpdateProfileDto, user: HomeOwner): Promise<UserProfileDto>;
  searchProfile(query:string): Promise<UserProfileDto[]>;
}
