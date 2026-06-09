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