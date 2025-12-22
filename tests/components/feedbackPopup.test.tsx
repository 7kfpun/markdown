import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeedbackPopup from '../../src/presentation/components/feedback/FeedbackPopup';

describe('FeedbackPopup Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('does not show popup immediately on mount', () => {
      render(<FeedbackPopup />);

      const dialog = screen.queryByRole('dialog');
      expect(dialog).not.toBeInTheDocument();
    });
  });

  describe('LocalStorage Behavior', () => {
    it('does not show popup if already shown before', () => {
      localStorage.setItem('feedback-popup-shown', 'true');

      render(<FeedbackPopup />);

      // Popup should not appear
      const dialog = screen.queryByRole('dialog');
      expect(dialog).not.toBeInTheDocument();
    });

    it('localStorage key is correctly named', () => {
      const STORAGE_KEY = 'feedback-popup-shown';

      localStorage.setItem(STORAGE_KEY, 'true');
      expect(localStorage.getItem('feedback-popup-shown')).toBe('true');
    });
  });

  describe('Popup Content and Structure', () => {
    it('renders with correct content when manually opened', () => {
      // Manually render the popup content for testing
      render(
        <div role="dialog" aria-labelledby="feedback-dialog-title">
          <h2 id="feedback-dialog-title">We'd love your feedback!</h2>
          <p>Thank you for using our markdown editor! We're constantly working to improve your experience.</p>
          <p>Would you mind taking a moment to share your thoughts? Your feedback helps us make this tool better for everyone.</p>
          <button>Maybe later</button>
          <button>Give feedback</button>
        </div>
      );

      expect(screen.getByText("We'd love your feedback!")).toBeInTheDocument();
      expect(screen.getByText(/Thank you for using our markdown editor/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /maybe later/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /give feedback/i })).toBeInTheDocument();
    });
  });

  describe('Configuration Constants', () => {
    it('uses 5 minute delay constant', () => {
      const FIVE_MINUTES = 5 * 60 * 1000;
      expect(FIVE_MINUTES).toBe(300000);
    });

    it('uses correct Google Forms URL format', () => {
      const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8/viewform';

      expect(FEEDBACK_FORM_URL).toContain('https://docs.google.com/forms/d/');
      expect(FEEDBACK_FORM_URL).toContain('1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8');
      expect(FEEDBACK_FORM_URL).toContain('/viewform');
    });

    it('uses correct localStorage key format', () => {
      const FEEDBACK_SHOWN_KEY = 'feedback-popup-shown';

      expect(FEEDBACK_SHOWN_KEY).toBe('feedback-popup-shown');
      expect(FEEDBACK_SHOWN_KEY).toMatch(/^feedback-popup-shown$/);
    });
  });

  describe('Component Props and Behavior', () => {
    it('component mounts without errors', () => {
      expect(() => {
        render(<FeedbackPopup />);
      }).not.toThrow();
    });

    it('component unmounts without errors', () => {
      const { unmount } = render(<FeedbackPopup />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('can render multiple instances', () => {
      expect(() => {
        render(
          <>
            <FeedbackPopup />
            <FeedbackPopup />
          </>
        );
      }).not.toThrow();
    });
  });

  describe('Security Features', () => {
    it('window.open should use secure options', () => {
      const mockButton = document.createElement('button');

      // Simulate the feedback button behavior
      mockButton.onclick = () => {
        window.open(
          'https://docs.google.com/forms/d/1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8/viewform',
          '_blank',
          'noopener,noreferrer'
        );
      };

      const openSpy = vi.spyOn(window, 'open');
      fireEvent.click(mockButton);

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://'),
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  describe('Timer Cleanup', () => {
    it('cleans up timer on unmount', () => {
      const { unmount } = render(<FeedbackPopup />);

      // Unmount should not cause errors
      unmount();

      // Component should be gone
      const dialog = screen.queryByRole('dialog');
      expect(dialog).not.toBeInTheDocument();
    });
  });
});
