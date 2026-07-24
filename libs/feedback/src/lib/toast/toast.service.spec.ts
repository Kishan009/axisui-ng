import { TestBed } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('adds a toast to the signal on show()', () => {
    service.show({ title: 'Hi' });
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].title).toBe('Hi');
  });

  it('assigns the default variant', () => {
    service.show({ title: 'X' });
    expect(service.toasts()[0].variant).toBe('default');
  });

  it('auto-dismisses after the duration', () => {
    service.show({ title: 'Bye', duration: 3000 });
    expect(service.toasts().length).toBe(1);
    jest.advanceTimersByTime(3000);
    expect(service.toasts().length).toBe(0);
  });

  it('does not auto-dismiss when duration is 0', () => {
    service.show({ title: 'Sticky', duration: 0 });
    jest.advanceTimersByTime(100000);
    expect(service.toasts().length).toBe(1);
  });

  it('ToastRef.dismiss() removes the toast', () => {
    const ref = service.show({ title: 'Manual', duration: 0 });
    ref.dismiss();
    expect(service.toasts().length).toBe(0);
  });

  it('service.dismiss(id) removes by id', () => {
    service.show({ title: 'A', duration: 0 });
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('pause() halts auto-dismiss; resume() continues with the banked remaining time', () => {
    service.show({ title: 'Hover me', duration: 3000 });
    jest.advanceTimersByTime(1000); // 2000ms should remain
    service.pause();
    jest.advanceTimersByTime(10000); // paused — nothing dismisses
    expect(service.toasts().length).toBe(1);
    service.resume();
    jest.advanceTimersByTime(1999);
    expect(service.toasts().length).toBe(1);
    jest.advanceTimersByTime(1); // remaining time elapses
    expect(service.toasts().length).toBe(0);
  });
});
