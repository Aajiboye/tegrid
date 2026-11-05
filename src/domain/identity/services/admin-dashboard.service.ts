import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import { HomeOwnerKycProfile } from '../models/homeowner-kyc.model';
import { TradePersonKycProfile } from '../models/trade-person-kyc.model';
import { HomeOwner } from '../models/home-owner-user.model';
import { TradePerson } from '../models/trade-person-user.model';
import { Admin } from '../models/admin.model';
import {
  AdminDashboardOverviewDto,
  AdminKycSubmissionItemDto,
  AdminKycSubmissionsQueryDto,
  AdminLiveActivityItemDto,
  AdminUserTypeFilter,
  AdminVerifiedUserItemDto,
  AdminVerifiedUsersQueryDto,
  KycApprovalFilter,
} from '../dtos/admin-dashboard.dto';
import { JobRequest, JobStatus } from 'src/domain/jobs/models/job-request.model';
import { JobRequestQuotation } from 'src/domain/jobs/models/job-request-quotation.model';
import { JobRequestQuotationEvent } from 'src/domain/jobs/models/job-request-quotation-event.model';
import { Payment } from 'src/domain/jobs/models/payment.model';
import { RentalReservation } from 'src/domain/store/models/rental-reservation.model';
import { StorePayment } from 'src/domain/store/models/store-payment.model';
import { AuditLog } from 'src/shared/models/audit.model';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(HomeOwnerKycProfile.name)
    private readonly homeOwnerKycModel: Model<HomeOwnerKycProfile>,
    @InjectModel(TradePersonKycProfile.name)
    private readonly tradePersonKycModel: Model<TradePersonKycProfile>,
    @InjectModel(HomeOwner.name)
    private readonly homeOwnerModel: Model<HomeOwner>,
    @InjectModel(TradePerson.name)
    private readonly tradePersonModel: Model<TradePerson>,
    @InjectModel(Admin.name)
    private readonly adminModel: Model<Admin>,
    @InjectModel(JobRequest.name)
    private readonly jobRequestModel: Model<JobRequest>,
    @InjectModel(JobRequestQuotation.name)
    private readonly quotationModel: Model<JobRequestQuotation>,
    @InjectModel(JobRequestQuotationEvent.name)
    private readonly quotationEventModel: Model<JobRequestQuotationEvent>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    @InjectModel(StorePayment.name)
    private readonly storePaymentModel: Model<StorePayment>,
    @InjectModel(RentalReservation.name)
    private readonly rentalReservationModel: Model<RentalReservation>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
  ) {}

  private makePage<T>(items: T[], total: number, page: number, size: number): PaginatedResponse<T[]> {
    const response = new PaginatedResponse<T[]>();
    response.page = page;
    response.size = size;
    response.pageTotal = Math.ceil(total / size) || 1;
    response.hasNext = page < response.pageTotal;
    response.hasPrevious = page > 1;
    response.data = items;
    return response;
  }

  private toFullName(firstName?: string, lastName?: string): string {
    return [firstName, lastName].filter(Boolean).join(' ').trim();
  }

  private buildKycFilter(status?: KycApprovalFilter): Record<string, any> {
    if (!status || status === KycApprovalFilter.PENDING) {
      return { status: 'PENDING' };
    }

    if (status === KycApprovalFilter.REJECTED) {
      return { status: 'REJECTED' };
    }

    return { status: { $ne: 'APPROVED' } };
  }

  async getPendingKycSubmissions(
    query: AdminKycSubmissionsQueryDto,
  ): Promise<PaginatedResponse<AdminKycSubmissionItemDto[]>> {
    const page = query.page || 1;
    const size = query.size || 20;
    const skip = (page - 1) * size;
    const statusFilter = this.buildKycFilter(query.status);

    const includeHomeOwners = !query.userType || query.userType === AdminUserTypeFilter.ALL || query.userType === AdminUserTypeFilter.HOME_OWNER;
    const includeTradePersons = !query.userType || query.userType === AdminUserTypeFilter.ALL || query.userType === AdminUserTypeFilter.TRADES_PERSON;

    const [homeOwnerProfiles, tradePersonProfiles] = await Promise.all([
      includeHomeOwners
        ? this.homeOwnerKycModel
            .find(statusFilter)
            .populate('user', 'email phoneNumber userName profileAvatar')
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve([]),
      includeTradePersons
        ? this.tradePersonKycModel
            .find(statusFilter)
            .populate('user', 'email phoneNumber userName profileAvatar')
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve([]),
    ]);

    const merged: AdminKycSubmissionItemDto[] = [
      ...homeOwnerProfiles.map((profile: any) => ({
        kycId: profile._id.toString(),
        userId: profile.user?._id?.toString(),
        userType: AdminUserTypeFilter.HOME_OWNER,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: this.toFullName(profile.firstName, profile.lastName) || profile.user?.userName || profile.user?.email,
        email: profile.user?.email,
        phoneNumber: profile.phoneNumber || profile.user?.phoneNumber,
        status: profile.status,
        rejectionReason: profile.rejectionReason || undefined,
        submittedAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : undefined,
      })),
      ...tradePersonProfiles.map((profile: any) => ({
        kycId: profile._id.toString(),
        userId: profile.user?._id?.toString(),
        userType: AdminUserTypeFilter.TRADES_PERSON,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: this.toFullName(profile.firstName, profile.lastName) || profile.user?.userName || profile.user?.email,
        email: profile.user?.email,
        phoneNumber: profile.phoneNumber || profile.user?.phoneNumber,
        status: profile.status,
        rejectionReason: profile.rejectionReason || undefined,
        submittedAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : undefined,
      })),
    ].sort((a, b) => {
      const at = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bt = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return bt - at;
    });

    return this.makePage(merged.slice(skip, skip + size), merged.length, page, size);
  }

  async getVerifiedUsers(
    query: AdminVerifiedUsersQueryDto,
  ): Promise<PaginatedResponse<AdminVerifiedUserItemDto[]>> {
    const page = query.page || 1;
    const size = query.size || 20;
    const skip = (page - 1) * size;

    const includeHomeOwners = !query.userType || query.userType === AdminUserTypeFilter.ALL || query.userType === AdminUserTypeFilter.HOME_OWNER;
    const includeTradePersons = !query.userType || query.userType === AdminUserTypeFilter.ALL || query.userType === AdminUserTypeFilter.TRADES_PERSON;

    const [homeOwnerProfiles, tradePersonProfiles] = await Promise.all([
      includeHomeOwners
        ? this.homeOwnerKycModel
            .find({ status: 'APPROVED' })
            .populate('user', 'email phoneNumber userName profileAvatar')
            .sort({ approvedAt: -1 })
            .lean()
        : Promise.resolve([]),
      includeTradePersons
        ? this.tradePersonKycModel
            .find({ status: 'APPROVED' })
            .populate('user', 'email phoneNumber userName profileAvatar')
            .sort({ approvedAt: -1 })
            .lean()
        : Promise.resolve([]),
    ]);

    const merged: AdminVerifiedUserItemDto[] = [
      ...homeOwnerProfiles.map((profile: any) => ({
        kycId: profile._id.toString(),
        userId: profile.user?._id?.toString(),
        userType: AdminUserTypeFilter.HOME_OWNER,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: this.toFullName(profile.firstName, profile.lastName) || profile.user?.userName || profile.user?.email,
        email: profile.user?.email,
        phoneNumber: profile.phoneNumber || profile.user?.phoneNumber,
        profileAvatar: profile.user?.profileAvatar,
        approvedAt: profile.approvedAt ? new Date(profile.approvedAt).toISOString() : undefined,
      })),
      ...tradePersonProfiles.map((profile: any) => ({
        kycId: profile._id.toString(),
        userId: profile.user?._id?.toString(),
        userType: AdminUserTypeFilter.TRADES_PERSON,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: this.toFullName(profile.firstName, profile.lastName) || profile.user?.userName || profile.user?.email,
        email: profile.user?.email,
        phoneNumber: profile.phoneNumber || profile.user?.phoneNumber,
        profileAvatar: profile.user?.profileAvatar,
        approvedAt: profile.approvedAt ? new Date(profile.approvedAt).toISOString() : undefined,
      })),
    ].sort((a, b) => {
      const at = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
      const bt = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
      return bt - at;
    });

    return this.makePage(merged.slice(skip, skip + size), merged.length, page, size);
  }

  private mapEventAction(event: any): string {
    if (event.eventType === 'QUOTE_SUBMITTED' && event.metadata?.revisionNumber) {
      return 'QUOTATION_REVISION_REQUEST';
    }

    const map = {
      QUOTE_SUBMITTED: 'QUOTATION_SUBMISSION',
      QUOTE_APPROVED: 'QUOTATION_APPROVAL',
      QUOTE_REJECTED: 'QUOTATION_REJECTION',
      ADMIN_REVIEW: 'QUOTATION_ADMIN_REVIEW',
      RESIDENT_PAID: 'QUOTATION_PAYMENT',
      JOB_COMPLETED: 'JOB_COMPLETION',
      QA_APPROVED: 'QA_APPROVED',
      PAYMENT_RELEASED: 'PAYMENT_RELEASED',
    } as Record<string, string>;

    return map[event.eventType] || event.eventType;
  }

  private async buildActorNameResolver() {
    const [homeOwners, tradePersons, admins, homeownerKycs, tradePersonKycs] = await Promise.all([
      this.homeOwnerModel.find({}, '_id email userName').lean(),
      this.tradePersonModel.find({}, '_id email userName').lean(),
      this.adminModel.find({}, '_id email').lean(),
      this.homeOwnerKycModel.find({}, 'user firstName lastName').lean(),
      this.tradePersonKycModel.find({}, 'user firstName lastName').lean(),
    ]);

    const homeOwnerMap = new Map(homeOwners.map((u: any) => [u._id.toString(), u]));
    const tradePersonMap = new Map(tradePersons.map((u: any) => [u._id.toString(), u]));
    const adminMap = new Map(admins.map((u: any) => [u._id.toString(), u]));

    const homeOwnerKycNameMap = new Map(
      homeownerKycs
        .filter((k: any) => k.user)
        .map((k: any) => [k.user.toString(), this.toFullName(k.firstName, k.lastName)]),
    );

    const tradePersonKycNameMap = new Map(
      tradePersonKycs
        .filter((k: any) => k.user)
        .map((k: any) => [k.user.toString(), this.toFullName(k.firstName, k.lastName)]),
    );

    return (actorId?: string): { fullName?: string; actorType?: string } => {
      if (!actorId) return {};

      if (adminMap.has(actorId)) {
        const admin = adminMap.get(actorId) as any;
        return { fullName: admin.email, actorType: 'ADMIN' };
      }

      if (homeOwnerMap.has(actorId)) {
        const homeowner = homeOwnerMap.get(actorId) as any;
        return {
          fullName: homeOwnerKycNameMap.get(actorId) || homeowner.userName || homeowner.email,
          actorType: 'HOME_OWNER',
        };
      }

      if (tradePersonMap.has(actorId)) {
        const tradesPerson = tradePersonMap.get(actorId) as any;
        return {
          fullName: tradePersonKycNameMap.get(actorId) || tradesPerson.userName || tradesPerson.email,
          actorType: 'TRADES_PERSON',
        };
      }

      return {};
    };
  }

  private async getLiveActivities(limit = 10): Promise<AdminLiveActivityItemDto[]> {
    const [quotationEvents, auditLogs, latestHomeOwnerKyc, latestTradePersonKyc] = await Promise.all([
      this.quotationEventModel.find({}).sort({ createdAt: -1 }).limit(60).lean(),
      this.auditLogModel.find({}).sort({ createdAt: -1 }).limit(60).lean(),
      this.homeOwnerKycModel.find({}).sort({ createdAt: -1 }).limit(30).lean(),
      this.tradePersonKycModel.find({}).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    const resolveActor = await this.buildActorNameResolver();

    const quotationActivities: AdminLiveActivityItemDto[] = quotationEvents.map((event: any) => {
      const actorId = event.performedBy?.toString() || event.tradePerson?.toString();
      const actor = resolveActor(actorId);
      return {
        action: this.mapEventAction(event),
        actorFullName: actor.fullName,
        actorType: actor.actorType,
        time: event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString(),
        details: {
          quotation: event.quotation?.toString(),
          jobRequest: event.jobRequest?.toString(),
          notes: event.notes,
          metadata: event.metadata,
        },
      };
    });

    const auditActivities: AdminLiveActivityItemDto[] = auditLogs.map((log: any) => {
      const actor = resolveActor(log.actor?.toString());
      return {
        action: log.action || 'AUDIT_EVENT',
        actorFullName: actor.fullName,
        actorType: actor.actorType,
        time: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
        details: {
          metadata: log.metadata,
          payload: log.payload,
        },
      };
    });

    const kycSubmissionActivities: AdminLiveActivityItemDto[] = [
      ...latestHomeOwnerKyc.map((kyc: any) => ({
        action: 'KYC_SUBMISSION',
        actorFullName: this.toFullName(kyc.firstName, kyc.lastName),
        actorType: 'HOME_OWNER',
        time: kyc.createdAt ? new Date(kyc.createdAt).toISOString() : new Date().toISOString(),
        details: { kycId: kyc._id.toString() },
      })),
      ...latestTradePersonKyc.map((kyc: any) => ({
        action: 'KYC_SUBMISSION',
        actorFullName: this.toFullName(kyc.firstName, kyc.lastName),
        actorType: 'TRADES_PERSON',
        time: kyc.createdAt ? new Date(kyc.createdAt).toISOString() : new Date().toISOString(),
        details: { kycId: kyc._id.toString() },
      })),
      ...latestHomeOwnerKyc
        .filter((kyc: any) => kyc.status === 'APPROVED' && kyc.approvedAt)
        .map((kyc: any) => ({
          action: 'KYC_VERIFICATION',
          actorFullName: this.toFullName(kyc.firstName, kyc.lastName),
          actorType: 'HOME_OWNER',
          time: new Date(kyc.approvedAt).toISOString(),
          details: { kycId: kyc._id.toString() },
        })),
      ...latestTradePersonKyc
        .filter((kyc: any) => kyc.status === 'APPROVED' && kyc.approvedAt)
        .map((kyc: any) => ({
          action: 'KYC_VERIFICATION',
          actorFullName: this.toFullName(kyc.firstName, kyc.lastName),
          actorType: 'TRADES_PERSON',
          time: new Date(kyc.approvedAt).toISOString(),
          details: { kycId: kyc._id.toString() },
        })),
    ];

    return [...quotationActivities, ...auditActivities, ...kycSubmissionActivities]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit);
  }

  async getDashboardOverview(): Promise<AdminDashboardOverviewDto> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      totalHomeOwners,
      totalTradePersons,
      activeJobs,
      pendingQuotes,
      pendingHomeOwnerKyc,
      pendingTradePersonKyc,
      totalRentals,
      jobRevenueAgg,
      storeRevenueAgg,
      liveActivityFeed,
    ] = await Promise.all([
      this.homeOwnerModel.countDocuments({ deletedAt: null }),
      this.tradePersonModel.countDocuments({ deletedAt: null }),
      this.jobRequestModel.countDocuments({ status: { $ne: JobStatus.COMPLETED } }),
      this.quotationModel.countDocuments({ reviewStatus: 'PENDING' }),
      this.homeOwnerKycModel.countDocuments({ status: { $ne: 'APPROVED' } }),
      this.tradePersonKycModel.countDocuments({ status: { $ne: 'APPROVED' } }),
      this.rentalReservationModel.countDocuments({}),
      this.paymentModel.aggregate([
        { $match: { status: { $in: ['SUCCESS', 'RELEASED'] }, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.storePaymentModel.aggregate([
        { $match: { status: 'SUCCESS', createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.getLiveActivities(10),
    ]);

    const jobRevenue = jobRevenueAgg?.[0]?.total || 0;
    const storeRevenue = storeRevenueAgg?.[0]?.total || 0;

    return {
      totalUsers: totalHomeOwners + totalTradePersons,
      activeJobs,
      pendingQuotes,
      pendingKyc: pendingHomeOwnerKyc + pendingTradePersonKyc,
      revenueToday: jobRevenue + storeRevenue,
      totalRentals,
      liveActivityFeed,
    };
  }
}
