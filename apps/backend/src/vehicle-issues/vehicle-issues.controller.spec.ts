import { Test, TestingModule } from '@nestjs/testing';
import { VehicleIssuesController } from './vehicle-issues.controller';

describe('VehicleIssuesController', () => {
  let controller: VehicleIssuesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleIssuesController],
    }).compile();

    controller = module.get<VehicleIssuesController>(VehicleIssuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
