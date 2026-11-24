import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(page = 1, limit = 10, q?: string) {
    const qb = this.customerRepository.createQueryBuilder('customer');

    if (q) {
      qb.andWhere(
        '(customer.firstName LIKE :q OR customer.lastName LIKE :q)',
        { q: `%${q}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('customer.customerId', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, page, limit, totalItems: total };
  }

  async findOne(customerId: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { customerId },
    });
    if (!customer) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: 'Customer not found.',
        errors: [`No customer exists with ID ${customerId}.`],
        timestamp: new Date().toISOString(),
      });
    }
    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    if (createCustomerDto.email) {
      const existing = await this.customerRepository.findOne({
        where: { email: createCustomerDto.email },
      });
      if (existing) {
        throw new ConflictException({
          success: false,
          statusCode: 409,
          message: 'Email already exists.',
          errors: [`A customer with email ${createCustomerDto.email} already exists.`],
          timestamp: new Date().toISOString(),
        });
      }
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async update(customerId: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(customerId);

    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existing = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email },
      });
      if (existing) {
        throw new ConflictException({
          success: false,
          statusCode: 409,
          message: 'Email already exists.',
          errors: [`A customer with email ${updateCustomerDto.email} already exists.`],
          timestamp: new Date().toISOString(),
        });
      }
    }

    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }
}
