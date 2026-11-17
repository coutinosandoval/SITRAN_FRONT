import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteCuponesVehiculo } from './reporte-cupones-vehiculo';

describe('ReporteCuponesVehiculo', () => {
  let component: ReporteCuponesVehiculo;
  let fixture: ComponentFixture<ReporteCuponesVehiculo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteCuponesVehiculo],
    }).compileComponents();

    fixture = TestBed.createComponent(ReporteCuponesVehiculo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
