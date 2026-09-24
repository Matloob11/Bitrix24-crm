<?php
declare(strict_types=1);

namespace Bitrix\Disk\Internal\Access\UnifiedLink;

use Bitrix\Disk\ExternalLink;
use Bitrix\Disk\File;
use Bitrix\Disk\Internal\Service\ExternalLink\ExternalLinkPasswordService;
use Bitrix\Disk\Internals\ExternalLinkTable;
use Bitrix\Disk\Public\Provider\ExternalLinkProvider;
use Bitrix\Main\ArgumentTypeException;

class ExternalLinkAccessCheckHandler extends ChainableAccessCheckHandler
{
	/**
	 * @param ExternalLinkProvider $externalLinkProvider
	 * @param ExternalLinkPasswordService $externalLinkPasswordService
	 * @param bool $shouldCheckPassword
	 */
	public function __construct(
		protected readonly ExternalLinkProvider $externalLinkProvider,
		protected readonly ExternalLinkPasswordService $externalLinkPasswordService,
		protected readonly bool $shouldCheckPassword,
	)
	{
	}

	protected function doCheck(File $file): UnifiedLinkAccessLevel
	{
		$externalLink = $this->externalLinkProvider->getForUnifiedLinkAccessCheck($file->getId());

		if (
			!$externalLink instanceof ExternalLink
			|| (
				$this->shouldCheckPassword
				&& $externalLink->hasPassword()
				&& !$this->checkPassword($externalLink)
			)
		)
		{
			return UnifiedLinkAccessLevel::Denied;
		}

		return match ($externalLink->getAccessRight()) {
			ExternalLinkTable::ACCESS_RIGHT_VIEW => UnifiedLinkAccessLevel::Read,
			ExternalLinkTable::ACCESS_RIGHT_EDIT => UnifiedLinkAccessLevel::Edit,
			default => UnifiedLinkAccessLevel::Denied,
		};
	}

	/**
	 * @param ExternalLink $externalLink
	 * @return bool
	 * @throws ArgumentTypeException
	 */
	protected function checkPassword(ExternalLink $externalLink): bool
	{
		return $this->externalLinkPasswordService->isConfirmed($externalLink);
	}
}
