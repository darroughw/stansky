// Photos on the estimate form. Netlify Forms takes one file per field and rejects a request
// over 8 MB, and a single phone photo can be 3-5 MB, so three untouched photos would fail and
// the visitor would lose their request. This shrinks each photo in the browser (longest side
// 1600px, plenty for Jack to judge a job) and spreads them over the photo_1..3 fields.
//
// Without this script the form still works: the picker is a plain single-photo photo_1 field.

export const MAX_PHOTOS = 3;
export const MAX_EDGE = 1600;
const QUALITY = 0.82;
/** Leaves room under Netlify's 8 MB request limit for the text fields. */
export const BUDGET_BYTES = 7 * 1024 * 1024;

/** Scales width and height down (never up) so the longer side is at most `max`. */
export function fitWithin(width: number, height: number, max = MAX_EDGE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Keeps image files only, at most MAX_PHOTOS, and reports how many were dropped. */
export function pickPhotos(files: File[]) {
  const images = files.filter((f) => f.type.startsWith('image/'));
  return { photos: images.slice(0, MAX_PHOTOS), skipped: files.length - Math.min(images.length, MAX_PHOTOS) };
}

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Returns a smaller JPEG copy, or the original when it can't be decoded or wouldn't shrink. */
export async function shrink(file: File): Promise<File> {
  try {
    const { source, width, height } = await decode(file);
    const size = fitWithin(width, height);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext('2d')!.drawImage(source, 0, 0, size.width, size.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  }
}

const supported = () => {
  try {
    return typeof DataTransfer === 'function' && !!new DataTransfer().items;
  } catch {
    return false;
  }
};

/** Upgrades the form's photo picker. Leaves the plain single-photo field alone if it can't. */
export function enhancePhotoField(form: HTMLFormElement) {
  const picker = form.querySelector<HTMLInputElement>('input[type="file"][data-photo-picker]');
  const status = form.querySelector<HTMLElement>('[data-photo-status]');
  const slots = [...form.querySelectorAll<HTMLInputElement>('input[type="file"][data-photo-slot]')];
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!picker?.name || !status || slots.length !== MAX_PHOTOS - 1 || !supported()) return;

  // The picker becomes a chooser only; hidden slots carry the files. The page holds slots for
  // photo_2 and photo_3; photo_1 is the picker itself until now, so its slot is made here
  // (a second photo_1 in the HTML would send an empty duplicate when this script doesn't run).
  const first = document.createElement('input');
  first.type = 'file';
  first.name = picker.name;
  first.hidden = true;
  first.tabIndex = -1;
  first.setAttribute('aria-hidden', 'true');
  slots[0].before(first);
  slots.unshift(first);
  picker.multiple = true;
  picker.removeAttribute('name');
  const say = (text: string) => (status.textContent = text);

  let run = 0;
  picker.addEventListener('change', async () => {
    const current = ++run;
    picker.setCustomValidity('');
    slots.forEach((slot) => (slot.files = new DataTransfer().files));
    const { photos, skipped } = pickPhotos([...(picker.files ?? [])]);
    if (!photos.length) return say(skipped ? 'Please choose photos (image files).' : '');

    if (submit) submit.disabled = true;
    say(`Preparing ${photos.length === 1 ? 'your photo' : `${photos.length} photos`}…`);
    const ready = await Promise.all(photos.map(shrink));
    if (current !== run) return; // the visitor picked again while these were processing
    if (submit) submit.disabled = false;

    ready.forEach((file, i) => {
      const dt = new DataTransfer();
      dt.items.add(file);
      slots[i].files = dt.files;
    });
    const total = ready.reduce((sum, f) => sum + f.size, 0);
    const count = `${ready.length} ${ready.length === 1 ? 'photo' : 'photos'} attached (${formatBytes(total)})`;
    const extra = skipped ? `. Only the first ${MAX_PHOTOS} photos will be sent.` : '.';
    if (total > BUDGET_BYTES) {
      picker.setCustomValidity(`These photos are too large to send together (${formatBytes(total)}). Please choose fewer.`);
      say(`${count}, which is too large to send. Please choose fewer photos.`);
    } else {
      say(count + extra);
    }
  });
}
