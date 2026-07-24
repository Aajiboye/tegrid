import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token } from '../models/token.model';

@Injectable()
export class TokenRepository {
  constructor(
    @InjectModel(Token.name)
    private readonly model: Model<Token>,
  ) {}

  async findById(id: string): Promise<Token> {
    return this.model.findById(id);
  }

  async findOne(query: any): Promise<Token> {
    return this.model.findOne(query);
  }

  async update(query: any, payload: any): Promise<Token> {
    return this.model.findOneAndUpdate(query, payload, { new: true });
  }

  async updateWithUpsert(query: any, payload: any): Promise<Token> {
    return this.model.findOneAndUpdate(query, payload, { upsert: true });
  }

  async deleteById(id: string): Promise<Token> {
    return this.model.findByIdAndDelete(id);
  }

  async save(payload: Token) {
    const newToken = new this.model(payload);
    return newToken.save();
  }
}
