import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phone ? { phone: dto.phone } : undefined,
        ].filter(Boolean) as { email?: string; phone?: string }[],
        isActive: true,
      },
    });

    if (!user) throw new UnauthorizedException("Invalid credentials");

    // Demo OTP for DOCTOR (and any user with otp) — Phase 0 continuity
    if (dto.otp) {
      if (dto.otp !== "123456") {
        throw new UnauthorizedException("Invalid OTP");
      }
    } else if (dto.password) {
      if (!user.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
        throw new UnauthorizedException("Invalid credentials");
      }
    } else {
      throw new UnauthorizedException("Password or OTP required");
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        bmdcNumber: user.bmdcNumber,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { chambers: { include: { chamber: true } } },
    });
    if (!user) throw new UnauthorizedException();
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
