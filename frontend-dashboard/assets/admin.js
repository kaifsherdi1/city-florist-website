// Preview selected photos before upload
document.querySelectorAll('input[data-preview]').forEach((input) => {
  const box = input.closest('form').querySelector('.upload-preview');
  input.addEventListener('change', () => {
    box.innerHTML = '';
    [...input.files].forEach((file) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      box.appendChild(img);
    });
  });
});

// Offer date presets
const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

document.querySelectorAll('[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const form = btn.closest('form');
    const start = new Date();
    const end = new Date();
    if (btn.dataset.preset === 'today') {
      end.setHours(23, 59, 0, 0);
    } else if (btn.dataset.preset === 'weekend') {
      const day = start.getDay();
      const toSat = (6 - day + 7) % 7;
      if (day !== 0 && day !== 6) start.setDate(start.getDate() + toSat);
      start.setHours(day === 0 || day === 6 ? start.getHours() : 0, day === 0 || day === 6 ? start.getMinutes() : 0, 0, 0);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + (end.getDay() === 6 ? 1 : 0));
      end.setHours(23, 59, 0, 0);
    } else {
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 0, 0);
    }
    form.querySelector('[name=starts_at]').value = local(start);
    form.querySelector('[name=ends_at]').value = local(end);
  });
});
