import { UserModel, IUserDocument } from '../models/user.model';
import type { RegisterDtoType } from '../dtos/user.dto';

export class UserRepository {
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel
  .findOne({ email: email.toLowerCase() })
  .select('+password')  
  .exec();
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id).exec();
  }

  async create(data: RegisterDtoType & { password: string }): Promise<IUserDocument> {
    return UserModel.create({
      fullName: data.fullName,
      email:    data.email.toLowerCase(),
      phone:    data.phone,
      password: data.password,
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }
  async update(id: string, fields: Record<string, any>): Promise<IUserDocument | null> {
  return UserModel.findByIdAndUpdate(id, fields, { new: true }).exec();
}
}