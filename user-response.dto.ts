export class UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: Date;

  constructor(user: Record<string, unknown>) {
    this.id = user._id as string;
    this.fullName = user.fullName as string;
    this.email = user.email as string;
    this.phone = user.phone as string;
    this.createdAt = user.createdAt as Date;
  }
}
