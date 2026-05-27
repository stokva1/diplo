import { Test, TestingModule } from '@nestjs/testing';
import { TripLogsService } from './trip-logs.service';

describe('TripLogsService', () => {
  let service: TripLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TripLogsService],
    }).compile();

    service = module.get<TripLogsService>(TripLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
