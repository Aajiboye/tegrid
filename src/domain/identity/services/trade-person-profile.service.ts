import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  CreateTradePersonProfilePayload,
  IdentityAndRightToWorkDocument,
  ITradePersonProfile,
  QualificationAndTrainingItem,
  TradePersonCompetencyComplianceData,
  TradePersonCredentialData,
  TradePersonProfileAggregateData,
  TradePersonProfileCoreData,
  TradePersonServiceOfferedData,
} from '../dtos/TradePersonProfileDto';
import { TradePerson } from '../models/trade-person-user.model';
import { TradePersonProfileRepository } from '../repositories/trade-person-profile.repo';
import { TradePersonKycRepository } from '../repositories/trade-person-kyc.repo';
import { TradePersonKycService } from './trade-person-kyc.service';
import { CompetencyTestRepository } from 'src/domain/competency-assessment/repositories/competency-test.repo';

@Injectable()
export class TradePersonProfileService implements ITradePersonProfile {
  constructor(
    private readonly tradePersonProfileRepo: TradePersonProfileRepository,
    private readonly tradePersonKycRepo: TradePersonKycRepository,
    private readonly tradePersonKycService: TradePersonKycService,
    private readonly competencyTestRepo: CompetencyTestRepository,
  ) {}

  async createProfile(
    tradePerson: TradePerson,
    payload: CreateTradePersonProfilePayload,
  ): Promise<TradePersonProfileAggregateData> {
    console.log('Creating/updating trade person profile for user:', tradePerson._id.toString());
    await this.tradePersonProfileRepo.upsertByUserId(tradePerson._id.toString(), {
      businessName: payload.businessName,
      serviceDescription: payload.serviceDescription,
      yearsOfExperience: payload.yearsOfExperience,
      profileAvatar: payload.profileAvatar,
      skills: payload.skills,
      schedule: payload.schedule,
      portfolio: payload.portfolio,
    } as any);

    return this.getProfile(tradePerson);
  }

  async getProfile(tradePerson: TradePerson): Promise<TradePersonProfileAggregateData> {
    const profile = await this.tradePersonProfileRepo.findByUserId(tradePerson._id.toString());
    if (!profile) {
      throw new BadRequestException('Trade person profile not found');
    }

    const kycProfile = await this.tradePersonKycRepo.findOne({
      user: new Types.ObjectId(tradePerson._id),
    });

    const competencySummary = await this.getCompetencySummary(tradePerson._id.toString());
    const kycStatus = await this.tradePersonKycService.getKycStatus(tradePerson);

  const coreProfile = this.mapCoreProfile(profile, tradePerson);

    const servicesOffered = this.mapServicesOffered(profile);

    const identityAndRightToWork: IdentityAndRightToWorkDocument[] = [];
    if (kycProfile?.identityType) {
      identityAndRightToWork.push({
        source: 'KYC',
        identityType: kycProfile.identityType,
        documentType: kycProfile.identityType,
        documentUrl: kycProfile.photoIdUrl,
        validity: 'VALID',
      });
    }
    if (kycProfile?.addressProofUrl) {
      identityAndRightToWork.push({
        source: 'KYC',
        documentType: 'ADDRESS_PROOF',
        documentUrl: kycProfile.addressProofUrl,
        validity: 'VALID',
      });
    }

    const qualificationsAndTrainings: QualificationAndTrainingItem[] = [];
    if (kycProfile?.healthAndSafetyCertificateUrl) {
      qualificationsAndTrainings.push({
        source: 'KYC',
        title: 'Health and Safety Certificate',
        certificateUrl: kycProfile.healthAndSafetyCertificateUrl,
        issuedDate: kycProfile.healthAndSafetyCertificateIssueDate,
        expiryDate: kycProfile.healthAndSafetyCertificateExpiryDate,
        validity: this.isExpired(kycProfile.healthAndSafetyCertificateExpiryDate) ? 'EXPIRED' : 'VALID',
      });
    }
    if (kycProfile?.policeCharacterReportUrl) {
      qualificationsAndTrainings.push({
        source: 'KYC',
        title: 'Police Character Report',
        certificateUrl: kycProfile.policeCharacterReportUrl,
        validity: 'VALID',
      });
    }
    if (competencySummary?.assessmentCount) {
      qualificationsAndTrainings.push({
        source: 'COMPETENCY_ASSESSMENT',
        title: 'Competency Assessment',
        issuedDate: competencySummary.assessmentDate,
        validity: competencySummary.passed ? 'VALID' : 'EXPIRED',
      });
    }

    const insuranceDocuments: TradePersonCredentialData[] = [];

    return {
      profile: coreProfile,
      reviews: [],
      servicesOffered,
      credentialsAndCompliance: {
        identityAndRightToWork,
        qualificationsAndTrainings,
        insuranceAndAccreditation: {
          insuranceDocuments,
          accreditation: {
            competencyAssessment: competencySummary ? [competencySummary] : [],
          },
        },
      },
    };
  }

  private mapCoreProfile(profile: any, tradePerson: TradePerson): TradePersonProfileCoreData {
    return {
      _id: profile._id?.toString(),
      userId: tradePerson._id?.toString(),
      userName: tradePerson.userName || '',
      businessName: profile.businessName,
      serviceDescription: profile.serviceDescription,
      yearsOfExperience: profile.yearsOfExperience,
      profileAvatar: profile.profileAvatar,
      skills: profile.skills || [],
      schedule: profile.schedule || [],
      portfolio: (profile.portfolio || []).map((p) => ({
        projectTitle: p.projectTitle,
        projectDescription: p.projectDescription,
        projectCategory: p.projectCategory,
        images: p.images || [],
      })),
      createdAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : undefined,
      updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : undefined,
      reviews: 0,
      jobsCompleted: 0,
      successRate: 0,
    };
  }

  private mapServicesOffered(profile: any): TradePersonServiceOfferedData[] {
    const skills = (profile.skills || []).map((s) => ({
      name: s,
      description: profile.serviceDescription,
    }));

    const portfolioCategories = (profile.portfolio || [])
      .map((p) => p?.projectCategory)
      .filter(Boolean)
      .map((category) => ({
        name: category.title,
        description: category.description,
      }));

    return [...skills, ...portfolioCategories];
  }

  private async getCompetencySummary(tradePersonId: string): Promise<TradePersonCompetencyComplianceData | undefined> {
    const tests = await this.competencyTestRepo.findAll({
      tradePersonId: new Types.ObjectId(tradePersonId),
    });

    if (!tests || tests.length === 0) {
      return undefined;
    }

    const latest = [...tests].sort((a: any, b: any) => {
      const aTime = new Date(a.assessmentDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.assessmentDate || b.createdAt || 0).getTime();
      return bTime - aTime;
    })[0] as any;

    return {
      assessmentCount: tests.length,
      latestScore: latest?.assessmentScore,
      jobType: this.extractJobType(latest),
      passed: latest?.passed,
      assessmentDate: latest?.assessmentDate
        ? new Date(latest.assessmentDate).toISOString()
        : undefined,
      validity: latest?.passed ? 'VALID' : 'EXPIRED',
    };
  }

  private extractJobType(test: any): string {
    return (
      test?.jobType ||
      test?.assessmentDetails?.[0]?.jobType ||
      'GENERAL'
    );
  }

  private isExpired(expiryDate?: string): boolean {
    if (!expiryDate) return false;
    const time = new Date(expiryDate).getTime();
    if (Number.isNaN(time)) return false;
    return time < Date.now();
  }
}
