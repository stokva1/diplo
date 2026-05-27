import { Test, TestingModule } from '@nestjs/testing';
import { VehicleIssuesService } from './vehicle-issues.service';

describe('VehicleIssuesService', () => {
  let service: VehicleIssuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleIssuesService],
    }).compile();

    service = module.get<VehicleIssuesService>(VehicleIssuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
