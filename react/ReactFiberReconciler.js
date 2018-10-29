import { findCurrentHostFiber, findCurrentHostFiberWithNoPortals } from 'react-reconciler/reflection';
import * as ReactInstanceMap from 'shared/ReactInstanceMap';
import { HostComponent, ClassComponent, ClassComponentLazy } from 'shared/ReactWorkTags';

import { getResultFromResolvedThenable } from 'shared/ReactLazyComponent';

import { getPublicInstance } from './ReactFiberHostConfig';
import {
	findCurrentUnmaskedContext,
	processChildContext,
	emptyContextObject,
	isContextProvider as isLegacyContextProvider,
} from './ReactFiberContext';
import { createFiberRoot } from './ReactFiberRoot';
import * as ReactFiberDevToolsHook from './ReactFiberDevToolsHook';
import {
	computeUniqueAsyncExpiration,
	requestCurrentTime,
	computeExpirationForFiber,
	scheduleWork,
	requestWork,
	flushRoot,
	batchedUpdates,
	unbatchedUpdates,
	flushSync,
	flushControlled,
	deferredUpdates,
	syncUpdates,
	interactiveUpdates,
	flushInteractiveUpdates,
} from './ReactFiberScheduler';
import { createUpdate, enqueueUpdate } from './ReactUpdateQueue';



function getContextForSubtree(parentComponent) {
	if (!parentComponent) {
		return emptyContextObject;
	}

	const fiber = ReactInstanceMap.get(parentComponent);
	const parentContext = findCurrentUnmaskedContext(fiber);

	if (fiber.tag === ClassComponent) {
		const Component = fiber.type;
		if (isLegacyContextProvider(Component)) {
			return processChildContext(fiber, Component, parentContext);
		}
	} else if (fiber.tag === ClassComponentLazy) {
		const Component = getResultFromResolvedThenable(fiber.type);
		if (isLegacyContextProvider(Component)) {
			return processChildContext(fiber, Component, parentContext);
		}
	}

	return parentContext;
}

function scheduleRootUpdate(current, element, expirationTime, callback) {
	const update = createUpdate(expirationTime);
	// Caution: React DevTools currently depends on this property
	// being called "element".
	// （导弹、火箭等的）有效载荷，有效负荷；收费载重，酬载；（工厂、企业等）工资负担
	update.payload = { element };

	callback = callback === undefined ? null : callback;
	if (callback !== null) {
		update.callback = callback;
	}
	enqueueUpdate(current, update);

	scheduleWork(current, expirationTime);
	return expirationTime;
}
// updateContainerAtExpirationTime使用scheduleRootUpdate
export function updateContainerAtExpirationTime(element, container, parentComponent, expirationTime, callback) {
	// TODO: If this is a nested container, this won't be the root.
	const current = container.current;

	const context = getContextForSubtree(parentComponent);
	if (container.context === null) {
		container.context = context;
	} else {
		container.pendingContext = context;
	}

	return scheduleRootUpdate(current, element, expirationTime, callback);
}
//找元素节点
function findHostInstance(component) {
	const fiber = ReactInstanceMap.get(component);

	const hostFiber = findCurrentHostFiber(fiber);
	if (hostFiber === null) {
		return null;
	}
	return hostFiber.stateNode;
}
//有什么意义
export function createContainer(containerInfo, isConcurrent, hydrate) {
	return createFiberRoot(containerInfo, isConcurrent, hydrate);
}

export function updateContainer(element, container, parentComponent, callback) {
	const current = container.current;
	const currentTime = requestCurrentTime();
	const expirationTime = computeExpirationForFiber(currentTime, current);
	return updateContainerAtExpirationTime(element, container, parentComponent, expirationTime, callback);
}

export {
	flushRoot,
	requestWork,
	computeUniqueAsyncExpiration,
	batchedUpdates,
	unbatchedUpdates,
	deferredUpdates,
	syncUpdates,
	interactiveUpdates,
	flushInteractiveUpdates,
	flushControlled,
	flushSync
};

export { findHostInstance };
//得到元素节点或组件实例
export function getPublicRootInstance(container) {
	const containerFiber = container.current;
	if (!containerFiber.child) {
		return null;
	}
	switch (containerFiber.child.tag) {
		case HostComponent:
			return getPublicInstance(containerFiber.child.stateNode);
		default:
			return containerFiber.child.stateNode;
	}
}


export function findHostInstanceWithNoPortals(fiber) {
	const hostFiber = findCurrentHostFiberWithNoPortals(fiber);
	if (hostFiber === null) {
		return null;
	}
	return hostFiber.stateNode;
}

export function injectIntoDevTools(devToolsConfig) {
	const { findFiberByHostInstance } = devToolsConfig;
	return ReactFiberDevToolsHook.injectInternals({
		...devToolsConfig,
		findHostInstanceByFiber(fiber) {
			const hostFiber = findCurrentHostFiber(fiber);
			if (hostFiber === null) {
				return null;
			}
			return hostFiber.stateNode;
		},
		findFiberByHostInstance(instance) {
			if (!findFiberByHostInstance) {
				// Might not be implemented by the renderer.
				return null;
			}
			return findFiberByHostInstance(instance);
		},
	});
}
