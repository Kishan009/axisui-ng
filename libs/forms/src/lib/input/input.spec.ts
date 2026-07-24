import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AxInputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [AxInputComponent],
  template: `<ax-input [(value)]="value" [placeholder]="placeholder" [disabled]="disabled" [type]="type()" />`,
})
class TestHostComponent {
  value: string | null = '';
  placeholder = 'Type here';
  disabled = false;
  type = signal<'text' | 'date' | 'time' | 'datetime-local'>('text');
}

describe('AxInputComponent', () => {
  it('renders an input element with the placeholder', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Type here');
  });

  it('emits value on input', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('hello');
  });

  it('is disabled when disabled is true', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('supports native date type', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.type.set('date');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('date');
    input.value = '2026-07-19';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('2026-07-19');
  });

  it('supports native time type', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.type.set('time');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('time');
    input.value = '14:30';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('14:30');
  });

  it('supports native datetime-local type', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.type.set('datetime-local');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('datetime-local');
  });
});
