/**
 * Reliable real military photograph mapper for all asset types and models.
 * Guarantees that every card and modal displays authentic, high-resolution photography
 * regardless of caching or legacy icon paths.
 */
export function getAssetRealImage(asset) {
  if (!asset) return '/images/assets/fighter_jet.jpg';

  const rawUrl = (asset.image_url || '').trim();
  // If already a valid real photo path
  if (rawUrl.startsWith('/images/assets/') && rawUrl.endsWith('.jpg')) {
    return rawUrl;
  }

  const model = (asset.model_name || '').toLowerCase();
  const type = (asset.asset_type || '').toLowerCase();
  const cat = (asset.category || '').toLowerCase();

  // 1. Fighter Jets
  if (
    type.includes('fighter') ||
    model.includes('su-30') ||
    model.includes('tejas') ||
    model.includes('rafale') ||
    model.includes('mirage')
  ) {
    return '/images/assets/fighter_jet.jpg';
  }

  // 2. Cargo & Transport Planes
  if (
    type.includes('cargo') ||
    model.includes('c-17') ||
    model.includes('il-76') ||
    type.includes('transport plane') ||
    model.includes('c-130') ||
    model.includes('an-32') ||
    model.includes('c-295')
  ) {
    return '/images/assets/cargo_plane.jpg';
  }

  // 3. Surveillance Planes
  if (
    type.includes('surveillance') ||
    model.includes('netra') ||
    model.includes('aew&c') ||
    model.includes('awacs') ||
    model.includes('phalcon') ||
    model.includes('dornier')
  ) {
    return '/images/assets/surveillance_plane.jpg';
  }

  // 4. Attack Helicopters
  if (
    type.includes('attack') ||
    model.includes('apache') ||
    model.includes('lch') ||
    model.includes('prachand') ||
    model.includes('rudra')
  ) {
    return '/images/assets/attack_helicopter.jpg';
  }

  // 5. Rescue & Medical Helicopters
  if (
    type.includes('rescue') ||
    type.includes('medical') ||
    model.includes('sar') ||
    model.includes('medevac') ||
    model.includes('chetak')
  ) {
    return '/images/assets/rescue_medical_helicopter.jpg';
  }

  // 6. Transport Helicopters
  if (
    type.includes('helicopter') ||
    model.includes('mi-17') ||
    model.includes('chinook') ||
    model.includes('dhruv')
  ) {
    return '/images/assets/transport_helicopter.jpg';
  }

  // 7. Tanks
  if (
    type.includes('tank') ||
    model.includes('t-90') ||
    model.includes('bhishma') ||
    model.includes('arjun') ||
    model.includes('t-72') ||
    model.includes('ajeya')
  ) {
    return '/images/assets/tank_t90.jpg';
  }

  // 8. Fuel Vehicles
  if (
    type.includes('fuel') ||
    model.includes('bowser') ||
    model.includes('refueler') ||
    model.includes('dispenser')
  ) {
    return '/images/assets/fuel_vehicle.jpg';
  }

  // 9. Military Trucks & Transport Vehicles
  if (
    type.includes('truck') ||
    type.includes('transport vehicle') ||
    model.includes('stallion') ||
    model.includes('tatra') ||
    model.includes('swaraj') ||
    model.includes('troop carrier') ||
    model.includes('lsv') ||
    model.includes('tug')
  ) {
    return '/images/assets/military_truck.jpg';
  }

  // 10. Armored Vehicles
  if (
    type.includes('armored') ||
    type.includes('armoured') ||
    model.includes('bmp') ||
    model.includes('sarath') ||
    model.includes('vajra') ||
    model.includes('whap')
  ) {
    return '/images/assets/armored_vehicle.jpg';
  }

  // Category fallbacks
  if (cat.includes('helicopter')) return '/images/assets/transport_helicopter.jpg';
  if (cat.includes('vehicle')) return '/images/assets/tank_t90.jpg';
  return '/images/assets/fighter_jet.jpg';
}
