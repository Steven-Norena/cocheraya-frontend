const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export const formatSoles = (amount: number) => PEN.format(amount);

export const parkingZones = {
  Miraflores: [-12.1221, -77.0298],
  Barranco: [-12.1464, -77.0219],
  'San Isidro': [-12.0955, -77.0340],
  Surco: [-12.1380, -77.0088],
  Chorrillos: [-12.1692, -77.0245],
} satisfies Record<string, [number, number]>;

export function distanceMeters(lat: number, lng: number, toLat: number, toLng: number) {
  const radians = Math.PI / 180;
  const a = Math.sin((toLat - lat) * radians / 2) ** 2
    + Math.cos(lat * radians) * Math.cos(toLat * radians) * Math.sin((toLng - lng) * radians / 2) ** 2;
  return 12_742_000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatDistance(distance: number) {
  return distance < 1000 ? Math.round(distance) + ' m' : (distance / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' km';
}
