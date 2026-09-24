import { EventEmitter } from "main.core.events";
import { DirectoryMenu } from 'mail.directorymenu';

export class LeftMenu
{
	constructor(config={
		dirsWithUnseenMailCounters: {},
		mailboxId:'',
		filterId: '',
		systemDirs :
		{
			spam: 'Spam',
			trash: 'Trash',
			outcome: 'Outcome',
			drafts: 'Drafts',
			inbox: 'Inbox',
		}
	})
	{
		const leftDirectoryMenuWrapper = document.querySelector('.mail-left-menu-wrapper');

		this.directoryMenu = new DirectoryMenu({
			dirsWithUnseenMailCounters: config['dirsWithUnseenMailCounters'],
			filterId: config['filterId'],
			systemDirs: config['systemDirs'],
			sortMode: config['sortMode'],
			collapsedFolders: config['collapsedFolders'],
			folderCustomOrder: config['folderCustomOrder'],
			folderDefaultOrder: config['folderDefaultOrder'],
			manualSortingAvailable: config['manualSortingAvailable'],
			mailboxId: config['mailboxId'],
			listImprovementsEnabled: config['listImprovementsEnabled'],
			favoritesLabel: config['favoritesLabel'],
		});

		const favoritesNode = this.directoryMenu.getFavoritesNode();
		if (favoritesNode)
		{
			leftDirectoryMenuWrapper.append(favoritesNode);
		}

		leftDirectoryMenuWrapper.append(this.directoryMenu.getNode());
	}
}
