import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { UserRepository } from '../repositories/user.repository';
import { HttpException } from '../exceptions/http-exception';
import { CONSTANTS } from '../configs/constant';
import type { RegisterDtoType, LoginDtoType } from '../dtos/user.dto';
import type { AuthResult, UserResponse } from '../types/user.type';
import type { IUserDocument } from '../models/user.model';

const DUMMY_HASH = '$2b$12$invalidhashpaddingtoensureconstanttimexxxxx';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDtoType): Promise<AuthResult> {
    const emailTaken = await this.userRepository.emailExists(dto.email);
    if (emailTaken) {
      throw new HttpException('An account with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(dto.password, CONSTANTS.SALT_ROUNDS);
    const user = await this.userRepository.create({ ...dto, password: hashedPassword });

    return this.buildAuthResult(user);
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDtoType): Promise<AuthResult> {
  const user = await this.userRepository.findByEmail(dto.email);

  if (!user) {
    throw new HttpException('Invalid email or password', 401);
  }

  if (!user.password) {
    throw new HttpException('User password missing in database', 500);
  }

  const passwordMatch = await bcrypt.compare(dto.password, user.password);

  if (!passwordMatch) {
    throw new HttpException('Invalid email or password', 401);
  }

  return this.buildAuthResult(user);
}

async getUserById(id: string): Promise<UserResponse> {
  const user = await this.userRepository.findById(id);
  if (!user) throw new HttpException('User not found', 404);
  return this.toUserResponse(user);
}

async updateProfile(
  id: string,
  updates: Partial<{ fullName: string; phone: string; bio: string; currentPassword: string; newPassword: string }>,
  file?: Express.Multer.File
): Promise<UserResponse> {
  const user = await this.userRepository.findById(id);
  if (!user) throw new HttpException('User not found', 404);

  const fields: Record<string, any> = {};
  if (updates.fullName) fields.fullName = updates.fullName;
  if (updates.phone)    fields.phone    = updates.phone;
  if (updates.bio)      fields.bio      = updates.bio;
  if (file)             fields.avatar   = `/uploads/${file.filename}`;

  if (updates.newPassword) {
    if (!updates.currentPassword) throw new HttpException('Current password required', 400);
    const valid = await bcrypt.compare(updates.currentPassword, user.password!);
    if (!valid) throw new HttpException('Current password is incorrect', 400);
    fields.password = await bcrypt.hash(updates.newPassword, CONSTANTS.SALT_ROUNDS);
  }

  const updated = await this.userRepository.update(id, fields);
  return this.toUserResponse(updated!);
}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildAuthResult(user: IUserDocument): AuthResult {
    const accessToken = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      CONSTANTS.JWT_SECRET,
      { expiresIn: CONSTANTS.JWT_EXPIRES_IN }
    );

    return {
      accessToken,
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(user: IUserDocument): UserResponse {
    return {
      id:        user._id.toString(),
      fullName:  user.fullName,
      email:     user.email,
      phone:     user.phone,
      createdAt: user.createdAt,
    };
  }
}