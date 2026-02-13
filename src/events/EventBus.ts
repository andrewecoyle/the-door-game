import Phaser from 'phaser';

// Singleton event emitter for cross-scene communication
const EventBus = new Phaser.Events.EventEmitter();
export default EventBus;
