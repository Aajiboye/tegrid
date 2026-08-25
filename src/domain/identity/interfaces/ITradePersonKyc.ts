import { ProfileDto } from "../dtos/kyc.dto";
import { BankDetailsDto, HealthAndSafetyComplianceDto, MainTradeDto, PersonalInformationDto, PoliceCharacterReportDto, TradePersonIdentityVerificationDto, TradePersonKycStatusResponse } from "../dtos/tradeperson.kyc.dto";
import { TradePerson } from "../models/trade-person-user.model";

export interface ITradePersonKyc {
    getKycStatus(user: TradePerson): Promise<TradePersonKycStatusResponse>;
    completePersonalInformation(user: TradePerson, personalInfoDto: PersonalInformationDto): Promise<ProfileDto>;
    completeIdentityVerification(user: TradePerson, tradePersonIdentityDto: TradePersonIdentityVerificationDto): Promise<ProfileDto>;
    completeHealthAndSafetyCompliance(user: TradePerson, healthAndSafetyComplianceDto: HealthAndSafetyComplianceDto): Promise<ProfileDto>;
    completePoliceCharacterReport(user: TradePerson, policeCharacterReportDto: PoliceCharacterReportDto): Promise<ProfileDto>;
    completeBankDetails(user: TradePerson, bankDetailsDto: BankDetailsDto): Promise<ProfileDto>;
    completeMainTrade(user: TradePerson, mainTradeDto: MainTradeDto): Promise<ProfileDto>;
}