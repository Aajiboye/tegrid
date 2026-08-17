import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JobTypeRepository } from '../repositories/job-type.repo';
import { JobRequestRepository } from '../repositories/job-request.repo';
import { CreateJobRequestDto, JobRequestResponseDto } from '../dtos/job-request.dto';
import { Types } from 'mongoose';
import { PageOptions, PaginatedResponse } from 'src/shared/dtos/pagination';
import { User } from 'src/domain/identity/models/user.model';
import { UserRepository } from 'src/domain/identity/repositories/user.repo';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

@Injectable()
export class JobsService {
  constructor(private readonly jobTypeRepo: JobTypeRepository, private readonly jobReqRepo: JobRequestRepository, private readonly userRepo: UserRepository) {}

  private mapJobRequestToDto(it: any) {
    return {
      _id: it._id?.toString(),
      title: it.title,
      description: it.description,
      budget: it.budget,
      currency: it.currency,
      preferredDate: it.preferredDate ? new Date(it.preferredDate).toISOString() : undefined,
      preferredTime: it.preferredTime,
      homeAddress: it.homeAddress,
      photos: it.photos || [],
      visibility: it.visibility,
      jobType: it.jobType,
      createdBy: it.createdBy,
      tradespersonId: it.tradespersonId ? it.tradespersonId.toString() : undefined,
      createdAt: it.createdAt ? new Date(it.createdAt).toISOString() : undefined,
    };
  }

  async seedDefaultJobTypes() {
    const defaults = ['Plumbing', 'Carpentry', 'Electrical', 'Painting'];
    for (const title of defaults) {
      const existing = await this.jobTypeRepo.findOne({ title });
      if (!existing) await this.jobTypeRepo.create({ title });
    }
  }

  async createJobRequest(user: User, dto: CreateJobRequestDto) {
    // validate jobType exists
    const jt = await this.jobTypeRepo.findOne({ _id: dto.jobTypeId });
    if (!jt) throw new NotFoundException('Job type not found');

    // validate tradespersonId if provided
    if (dto.visibility === 'PRIVATE' && !dto.tradespersonId) {
     throw new BadRequestException('tradespersonId must be provided for PRIVATE visibility');
    }

    if(dto.tradespersonId === user._id.toString()) {
      throw new BadRequestException('tradespersonId cannot be the same as the user');
    }

    if(dto.visibility == "PRIVATE" && !(await this.userRepo.findOne({_id: dto.tradespersonId, userType: UserType.TRADESPERSON}))) {
      throw new BadRequestException('Invalid tradespersonId');
    }

    console.log('preferredDate:', dto.preferredDate, 'current date:', new Date().toISOString());
    if(dto.preferredDate < new Date().toISOString()) {
      throw new BadRequestException('preferredDate cannot be in the past');
    }

    const payload: any = {
      jobType: new Types.ObjectId(dto.jobTypeId),
      title: dto.title,
      description: dto.description,
      budget: dto.budget,
      currency: dto.currency || 'NGN',
      preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : undefined,
      preferredTime: dto.preferredTime,
      homeAddress: dto.homeAddress,
      photos: dto.photos || [],
      visibility: dto.visibility || 'PUBLIC',
      tradespersonId: dto.tradespersonId ? new Types.ObjectId(dto.tradespersonId) : undefined,
      createdBy: new Types.ObjectId(user._id),
    };

    // Business rule: preferredDate cannot be in the past
    if (payload.preferredDate) {
      const now = new Date();
      const preferred = new Date(payload.preferredDate);
      if (preferred.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) {
        throw new BadRequestException('preferredDate cannot be in the past');
      }
    }

    // Business rule: if visibility is PRIVATE, tradespersonId must be provided
    if (payload.visibility === 'PRIVATE' && !payload.tradespersonId) {
      throw new BadRequestException('tradespersonId must be provided for PRIVATE visibility');
    }

    const doc = await this.jobReqRepo.create(payload);
    return this.mapJobRequestToDto(doc);
  }

  async listForUser(user: any, pageOptions: PageOptions, search?: string): Promise<PaginatedResponse<JobRequestResponseDto[]>> {
    const query: any = { createdBy: new Types.ObjectId(user._id) };
    if (search) query['title'] = { $regex: search, $options: 'i' };
    const paged = await this.jobReqRepo.findPaged(query, pageOptions, undefined, { createdAt: -1 });
    const mapped = new PaginatedResponse<JobRequestResponseDto[]>();
    mapped.page = paged.page;
    mapped.size = paged.size;
    mapped.pageTotal = paged.pageTotal;
    mapped.hasNext = paged.hasNext;
    mapped.hasPrevious = paged.hasPrevious;
    mapped.data = (paged.data || []).map((it: any) => this.mapJobRequestToDto(it));
    return mapped;
  }

  async adminList(pageOptions: PageOptions, search?: string): Promise<PaginatedResponse<JobRequestResponseDto[]>> {
    const query: any = {};
    if (search) query['title'] = { $regex: search, $options: 'i' };
    const paged = await this.jobReqRepo.findPaged(query, pageOptions, undefined, { createdAt: -1 });
    const mapped = new PaginatedResponse<JobRequestResponseDto[]>();
    mapped.page = paged.page;
    mapped.size = paged.size;
    mapped.pageTotal = paged.pageTotal;
    mapped.hasNext = paged.hasNext;
    mapped.hasPrevious = paged.hasPrevious;
    mapped.data = (paged.data || []).map((it: any) => this.mapJobRequestToDto(it));
    return mapped;
  }
}
