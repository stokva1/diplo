import { Test, TestingModule } from '@nestjs/testing';
import { ServiceEventsController } from './service-events.controller';

describe('ServiceEventsController', () => {
  let controller: ServiceEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceEventsController],
    }).compile();

    controller = module.get<ServiceEventsController>(ServiceEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
