/**
 * @module stafftrack/layout/check-in-v2/form/src/file-field
 */
jn.define('stafftrack/layout/check-in-v2/form/src/file-field', (require, exports, module) => {
	/* global include, MediaConverter */
	include('MediaConverter');

	const { Type } = require('type');
	const { Filesystem } = require('native/filesystem');
	const { FileFieldClass } = require('layout/ui/fields/file');
	const { AirCompactThemeField } = require('layout/ui/fields/file/theme/air-compact');
	const { getMimeType } = require('utils/file');

	const MEDIA_RESIZE_OPTIONS = Object.freeze({
		quality: 80,
		width: 1920,
		height: 1080,
	});

	class CheckInFileFieldClass extends FileFieldClass
	{
		async onAddFile(addedFiles)
		{
			const preparedFiles = await this.resolveICloudFiles(addedFiles);
			super.onAddFile(preparedFiles);
		}

		async resolveICloudFiles(files)
		{
			if (
				!Array.isArray(files)
				|| Application.getPlatform() !== 'ios'
				|| !Type.isFunction(MediaConverter.getUrliCloudFile)
			)
			{
				return files;
			}

			return Promise.all(files.map((file) => this.resolveICloudFile(file)));
		}

		async resolveICloudFile(file)
		{
			const url = file?.url ?? '';
			const isiCloudFile = url.startsWith('icloudvideo://') || url.startsWith('icloudimage://');
			if (!isiCloudFile)
			{
				return file;
			}

			try
			{
				const iCloudFile = await MediaConverter.getUrliCloudFile(url);
				const fileInfo = await Filesystem.getFile(iCloudFile.url);

				return {
					...file,
					name: fileInfo?.name ?? file.name,
					type: fileInfo?.type ?? file.type,
					size: fileInfo?.size ?? file.size,
				};
			}
			catch (error)
			{
				console.warn('CheckInFileField: failed to resolve iCloud file', error);

				return file;
			}
		}

		getResizeOptions(type)
		{
			// stafftrackmobile: 0244771:
			// mobile: 0177829:
			const mimeType = getMimeType(type);
			if (
				mimeType === 'image/heic'
				|| mimeType === 'image/heif'
				|| mimeType.startsWith('video/')
			)
			{
				return MEDIA_RESIZE_OPTIONS;
			}

			return null;
		}
	}

	const CheckInFileField = AirCompactThemeField(CheckInFileFieldClass);

	module.exports = { CheckInFileField };
});
