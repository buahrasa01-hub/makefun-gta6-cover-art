export async function runShot(shot, query, loadPhoto) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') === 'pier' ? 'pier' : 'boulevard';
  await loadPhoto(photo);
}
