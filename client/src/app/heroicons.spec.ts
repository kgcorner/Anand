import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroHeart } from '@ng-icons/heroicons/outline';

@Component({
  imports: [NgIcon],
  providers: [provideIcons({ heroHeart })],
  template: '<ng-icon name="heroHeart" aria-hidden="true" />',
})
class IconTestComponent {}

describe('Heroicons', () => {
  it('renders a registered icon', async () => {
    const fixture = TestBed.createComponent(IconTestComponent);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('ng-icon svg')).toBeTruthy();
  });
});
