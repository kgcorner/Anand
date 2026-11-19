import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { ComponentCatalog } from './component-catalog';

describe('ComponentCatalog', () => {
  let fixture: ComponentFixture<ComponentCatalog>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentCatalog],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentCatalog);
    fixture.detectChanges();
    await fixture.whenStable();
    root = fixture.nativeElement as HTMLElement;
  });

  function findButton(text: string): HTMLButtonElement | undefined {
    return Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes(text),
    );
  }

  it('should create the catalog', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all six design-spec sections', () => {
    expect(root.querySelectorAll('section').length).toBe(6);
    expect(root.querySelector('h1')?.textContent).toContain('Clinical Component Library');
  });

  it('should link every section nav entry to an existing anchor', () => {
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('nav a'));
    expect(links.length).toBe(5);
    for (const link of links) {
      const id = link.getAttribute('href')?.replace('#', '');
      expect(id).toBeTruthy();
      expect(root.querySelector(`#${id}`)).toBeTruthy();
    }
  });

  it('should render one icon per curated core icon', () => {
    const icons = root.querySelectorAll('#typography-colors ul li ng-icon');
    expect(icons.length).toBe(20);
  });

  it('should toggle the privacy switch and its aria-checked state', () => {
    const toggle = root.querySelector<HTMLButtonElement>('button[role="switch"]');
    expect(toggle?.getAttribute('aria-checked')).toBe('true');

    toggle?.click();
    fixture.detectChanges();
    expect(toggle?.getAttribute('aria-checked')).toBe('false');

    toggle?.click();
    fixture.detectChanges();
    expect(toggle?.getAttribute('aria-checked')).toBe('true');
  });

  it('should select the severity radio that is clicked', () => {
    const severe = root.querySelector<HTMLInputElement>('input[name="severity"][value="severe"]');
    const moderate = root.querySelector<HTMLInputElement>(
      'input[name="severity"][value="moderate"]',
    );
    expect(moderate?.checked).toBe(true);

    if (severe) {
      severe.checked = true;
      severe.dispatchEvent(new Event('change'));
    }
    fixture.detectChanges();
    expect(severe?.checked).toBe(true);
    expect(moderate?.checked).toBe(false);
  });

  it('should switch the active profile and update aria-pressed', () => {
    const mother = findButton('Sunita G.');
    const self = findButton('Keshav G.');
    expect(self?.getAttribute('aria-pressed')).toBe('true');
    expect(mother?.getAttribute('aria-pressed')).toBe('false');

    mother?.click();
    fixture.detectChanges();
    expect(mother?.getAttribute('aria-pressed')).toBe('true');
    expect(self?.getAttribute('aria-pressed')).toBe('false');
  });

  it('should dismiss a toast and restore it with the restore control', () => {
    const dismiss = root.querySelector<HTMLButtonElement>(
      'button[aria-label="Dismiss notification"]',
    );
    expect(root.textContent).toContain('Lab Results Saved Successfully');

    dismiss?.click();
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Lab Results Saved Successfully');

    findButton('Restore toasts')?.click();
    fixture.detectChanges();
    expect(root.textContent).toContain('Lab Results Saved Successfully');
  });

  it('should dismiss the remote provider snackbar', () => {
    expect(root.textContent).toContain('Remote Provider Active');

    findButton('Dismiss')?.click();
    fixture.detectChanges();
    expect(root.textContent).not.toContain('Remote Provider Active');
  });
});

describe('ComponentCatalog route', () => {
  it('should resolve /dev/components to the catalog', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });

    const harness = await RouterTestingHarness.create('/dev/components');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Clinical Component Library',
    );
  });
});
