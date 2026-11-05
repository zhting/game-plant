// The Wukong document boots directly, with its own identity and campaign.
import { startArcade } from '/games/shared/arcade-engine.mjs?v=south-gate-1';
import * as wukongDependencies from './engine-dependencies.mjs?v=south-gate-1';

startArcade(wukongDependencies);
