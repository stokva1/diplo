import { Test, TestingModule } from '@nestjs/testing';
import { TripLogsController } from './trip-logs.controller';

describe('TripLogsController', () => {
  let controller: TripLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripLogsController],
    }).compile();

    controller = module.get<TripLogsController>(TripLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
