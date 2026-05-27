import { Test, TestingModule } from '@nestjs/testing';
import { ServiceEventsService } from './service-events.service';

describe('ServiceEventsService', () => {
  let service: ServiceEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceEventsService],
    }).compile();

    service = module.get<ServiceEventsService>(ServiceEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
