import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.model';
import { CreateUserDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate a user by email and password
   */
  async validateUser(email: string, password: string): Promise<any> {
    // Find user by email
    const user = await this.userModel.findOne({ email });
    
    // Check if user exists and if password is valid
    if (user && await user.validatePassword(password)) {
      // Update last login timestamp
      user.lastLoginAt = new Date();
      await user.save();
      
      // Return user without the password hash
      const { passwordHash, ...result } = user.toJSON();
      return result;
    }
    
    return null;
  }

  /**
   * Login a user and return JWT token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    // Validate user credentials
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Generate JWT token
    const payload = { sub: user._id, email: user.email };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Register a new user
   */
  async register(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new this.userModel({
      email,
      passwordHash,
      firstName,
      lastName,
      lastLoginAt: new Date(),
    });
    
    // Save user
    await newUser.save();
    
    // Return user without the password hash
    const { passwordHash: _, ...result } = newUser.toJSON();
    
    // Generate JWT token
    const payload = { sub: result._id, email: result.email };
    
    this.logger.log(`User registered: ${email}`);
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: result._id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      },
    };
  }
  
  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }
} 