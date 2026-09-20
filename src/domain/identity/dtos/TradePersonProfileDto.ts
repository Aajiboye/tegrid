import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TradePerson } from '../models/trade-person-user.model';
import { IsArray, IsPositive, IsString } from 'class-validator';

export class TradePersonProfileScheduleEntry {
    day: string;
    startTime: string;
    endTime: string;
}

export class TradePersonPortfolioEntry {
    projectTitle: string;
    projectDescription: string;
    projectCategory: string;
    images: string[];
}

export class CreateTradePersonProfilePayload {
    @ApiProperty()
    @IsString()
    businessName: string;

    @ApiProperty()
    @IsString()
    serviceDescription: string;

    @ApiProperty()
    @IsPositive()
    yearsOfExperience: number;

    @ApiProperty()
    @IsString()
    profileAvatar: string;

    @ApiProperty()
    @IsString({ each: true })
    skills: string[];

    @ApiProperty()
    @IsArray()
    schedule: TradePersonProfileScheduleEntry[];

    @ApiProperty()
    @IsArray()
    portfolio: TradePersonPortfolioEntry[];
}

export class TradePersonProfileCoreData {
    _id: string;
    userId: string;
    @ApiProperty()
    userName: string;
    @ApiProperty()
    businessName: string;

    @ApiProperty()
    serviceDescription: string;

    @ApiProperty()
    yearsOfExperience: number;

    @ApiProperty()
    profileAvatar: string;

    @ApiProperty()
    skills: string[];

    @ApiProperty()
    schedule: TradePersonProfileScheduleEntry[];

    @ApiProperty()
    portfolio: TradePersonPortfolioEntry[];

    @ApiPropertyOptional()
    createdAt?: string;
    
    @ApiPropertyOptional()
    updatedAt?: string;

    @ApiPropertyOptional()
    reviews?: number;

    @ApiPropertyOptional()
    jobsCompleted?: number;

    @ApiPropertyOptional()
    successRate?: number;
}

export class TradePersonReviewData {
    reviewerId: string;
    reviewerFirstname: string;
    reviewerLastname: string;
    rating: number;
    comment?: string;
    createdAt?: string;
}

export class TradePersonServiceOfferedData {
    name: string;
    description?: string;
    category?: string;
}

export class TradePersonCredentialData {
    title: string;
    issuer?: string;
    issueDate?: string;
    expiryDate?: string;
    credentialUrl?: string;
}

export class IdentityAndRightToWorkDocument {
    documentType: string;
    documentUrl?: string;
    identityType?: string;
    source: 'KYC';
    validity: 'VALID'| 'EXPIRED';
}

export class QualificationAndTrainingItem {
    title: string;
    certificateUrl?: string;
    issuedDate?: string;
    expiryDate?: string;
    source: 'KYC' | 'COMPETENCY_ASSESSMENT';
        validity: 'VALID'| 'EXPIRED';

}

export class TradePersonCompetencyComplianceData {
    latestScore?: number;
    jobType: string;
    passed?: boolean;
    assessmentDate?: string;
    assessmentCount?: number;
        validity: 'VALID'| 'EXPIRED';

}

export class InsuranceAndAccreditationData {
    insuranceDocuments: TradePersonCredentialData[];
    accreditation: {
        competencyAssessment?: TradePersonCompetencyComplianceData[];
    };
}

export class TradePersonCredentialsAndComplianceData {
    identityAndRightToWork: IdentityAndRightToWorkDocument[];
    qualificationsAndTrainings: QualificationAndTrainingItem[];
    insuranceAndAccreditation: InsuranceAndAccreditationData;
}

export class TradePersonProfileAggregateData {
    @ApiPropertyOptional()
    profile: TradePersonProfileCoreData;

    @ApiPropertyOptional()
    reviews: TradePersonReviewData[];

    @ApiPropertyOptional()
    servicesOffered: TradePersonServiceOfferedData[];

    @ApiPropertyOptional()
    credentialsAndCompliance: TradePersonCredentialsAndComplianceData;
}

export interface ITradePersonProfile {
    createProfile(
        tradePerson: TradePerson,
        payload: CreateTradePersonProfilePayload,
    ): Promise<TradePersonProfileAggregateData>;

    getProfile(
        tradePerson: TradePerson,
    ): Promise<TradePersonProfileAggregateData>;
}
