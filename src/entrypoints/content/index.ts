import './overlay.css';
import { getAuthToken } from '~/api/auth';
import { setTokenRefreshCallback } from '~/api/sheets';
import { Repository } from '~/api/repository';
import { getSettings, saveSettings } from '~/content/storage';
import { showErrorBanner } from '~/content/error-banner';
import { promptForIdentity } from '~/content/identity-modal';
import { promptForSpreadsheetId } from '~/content/spreadsheet-modal';
import { OverlayController } from '~/content/overlay-controller';
import { startPhotoObserver } from '~/content/photo-observer';
import { showHoverCard, hideHoverCard } from '~/content/hover-card';
import { showItemPanel, hideItemPanel } from '~/content/item-panel';
import { showNewPlaceholderPanel, hideNewPlaceholderPanel } from '~/content/new-placeholder-panel';

export default defineContentScript({
  matches: ['https://photos.google.com/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'manifest',

  main() {
    console.log('[GPhotos Annotator] Content script loaded');
    // Message count cache for hover cards (populated on item load)
    const messageCountCache = new Map<string, number>();

    /**
     * Initialize extension configuration (spreadsheet ID and current user).
     * Returns the initialized values only when everything is ready.
     */
    async function initializeConfig(): Promise<{ spreadsheetId: string; currentUser: string }> {
      const settings = await getSettings();

      // Step 1: Ensure spreadsheet ID is set
      let spreadsheetId = settings.spreadsheetId;
      if (!spreadsheetId) {
        spreadsheetId = await promptForSpreadsheetId();
        await saveSettings({ spreadsheetId });
      }

      // Step 2: Ensure current user is set
      let currentUser = settings.currentUser;
      if (!currentUser) {
        // We need to fetch interessés list, but this requires auth
        const token = await getAuthToken();
        const repo = new Repository(spreadsheetId, token);

        let interesses: string[];
        try {
          interesses = await repo.getInteresses();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          // If spreadsheet access fails, clear settings and restart
          await saveSettings({ spreadsheetId: null, currentUser: null });

          showErrorBanner(
            `Impossible d'accéder à la spreadsheet (${errorMessage}).\n\n` +
            `Vérifiez que :\n` +
            `• L'ID de spreadsheet est correct\n` +
            `• La feuille "db-interessés" existe\n` +
            `• La spreadsheet est partagée avec votre compte Google`
          );

          throw error;
        }

        currentUser = await promptForIdentity(interesses);
        await saveSettings({ currentUser });
      }

      return { spreadsheetId, currentUser };
    }

    async function init() {
      console.log('[GPhotos Annotator] Initializing extension');

      // Step 1: Get configuration (spreadsheet ID + current user)
      const { spreadsheetId, currentUser } = await initializeConfig();

      // Step 2: Now that we have all required config, initialize the repository
      const token = await getAuthToken();
      const repo = new Repository(spreadsheetId, token);

      // Auto-refresh token on 401
      setTokenRefreshCallback((newToken) => {
        repo.updateToken(newToken);
      });

      // Step 3: Fetch interessés list for the UI
      let allInteresses: string[];
      try {
        allInteresses = await repo.getInteresses();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        showErrorBanner(
          `Impossible d'accéder à la spreadsheet (${errorMessage}).\n\n` +
          `Vérifiez que :\n` +
          `• L'ID de spreadsheet est correct\n` +
          `• La feuille "db-interessés" existe\n` +
          `• La spreadsheet est partagée avec votre compte Google`
        );

        throw error;
      }
      const controller = new OverlayController(repo, currentUser);

      controller.onDotHover = async (item, event) => {
        let count = messageCountCache.get(item.id);
        if (count === undefined) {
          const msgs = await repo.getMessagesForItem(item.id);
          count = msgs.length;
          messageCountCache.set(item.id, count);
        }
        showHoverCard(item, count, event);
      };

      controller.onDotLeave = () => {
        hideHoverCard();
      };

      controller.onDotClick = (item, _event) => {
        hideHoverCard();
        showItemPanel({
          item,
          currentPhotoId: controller.getCurrentPhotoId()!,
          currentUser: currentUser!,
          interesses: allInteresses,
          repo,
          onClose: () => {},
          onRefresh: async () => {
            messageCountCache.clear();
            await controller.refresh();
          },
        });
      };

      controller.onDoubleClick = (x, y, photoId) => {
        console.log('[GPhotos Annotator] onDoubleClick callback triggered', { x, y, photoId });
        hideItemPanel();
        showNewPlaceholderPanel({
          x,
          y,
          photoId,
          existingItems: controller.getAllItems(),
          repo,
          onDone: async () => {
            messageCountCache.clear();
            await controller.refresh();
          },
        });
      };

      const stop = startPhotoObserver((photoId, img) => {
        hideItemPanel();
        hideHoverCard();
        messageCountCache.clear();
        controller.mount(photoId, img);
      });

      window.addEventListener('unload', stop);
    }

    init().catch((err) => {
      console.error('GPhotos Annotator init failed:', err);
      showErrorBanner(`Erreur d'initialisation : ${err instanceof Error ? err.message : String(err)}`);
    });
  },
});
