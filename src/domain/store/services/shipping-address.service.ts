import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ShippingAddressRepository } from '../repositories/shipping-address.repo';
import { ShippingAddress } from '../models/shipping-address.model';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import {
  CreateShippingAddressDto,
  UpdateShippingAddressDto,
  ShippingAddressResponseDto,
} from '../dtos/shipping-address.dto';

@Injectable()
export class ShippingAddressService {
  constructor(private readonly addressRepo: ShippingAddressRepository) {}

  async create(userId: string, userType: UserType, dto: CreateShippingAddressDto): Promise<ShippingAddressResponseDto> {
    if (dto.isDefault) {
      await this.addressRepo.clearDefaultByUser(userId, userType);
    }

    const address = await this.addressRepo.create({
      user: new Types.ObjectId(userId),
      userType,
      label: dto.label,
      recipientName: dto.recipientName,
      phoneNumber: dto.phoneNumber,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      postalCode: dto.postalCode,
      isDefault: dto.isDefault,
    });

    return this.mapToDto(address);
  }

  async findByUser(userId: string, userType: UserType): Promise<ShippingAddressResponseDto[]> {
    const addresses = await this.addressRepo.findByUser(userId, userType);
    return addresses.map((a) => this.mapToDto(a));
  }

  async update(
    userId: string,
    userType: UserType,
    addressId: string,
    dto: UpdateShippingAddressDto,
  ): Promise<ShippingAddressResponseDto> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.user.toString() !== userId || address.userType !== userType) {
      throw new NotFoundException('Shipping address not found');
    }

    if (dto.isDefault) {
      await this.addressRepo.clearDefaultByUser(userId, userType);
    }

    const updated = await this.addressRepo.update(addressId, {
      label: dto.label,
      recipientName: dto.recipientName,
      phoneNumber: dto.phoneNumber,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      postalCode: dto.postalCode,
      isDefault: dto.isDefault,
    });

    return this.mapToDto(updated!);
  }

  async delete(userId: string, userType: UserType, addressId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.user.toString() !== userId || address.userType !== userType) {
      throw new NotFoundException('Shipping address not found');
    }
    await this.addressRepo.deleteById(addressId);
  }

  async setDefault(userId: string, userType: UserType, addressId: string): Promise<ShippingAddressResponseDto> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.user.toString() !== userId || address.userType !== userType) {
      throw new NotFoundException('Shipping address not found');
    }

    await this.addressRepo.clearDefaultByUser(userId, userType);
    const updated = await this.addressRepo.update(addressId, { isDefault: true });
    return this.mapToDto(updated!);
  }

  async getDefault(userId: string, userType: UserType): Promise<ShippingAddressResponseDto | null> {
    const address = await this.addressRepo.findDefaultByUser(userId, userType);
    return address ? this.mapToDto(address) : null;
  }

  private mapToDto(address: ShippingAddress): ShippingAddressResponseDto {
    return {
      _id: (address._id as any).toString(),
      label: address.label,
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
      createdAt: address.createdAt ? new Date(address.createdAt).toISOString() : undefined,
      updatedAt: address.updatedAt ? new Date(address.updatedAt).toISOString() : undefined,
    };
  }
}
