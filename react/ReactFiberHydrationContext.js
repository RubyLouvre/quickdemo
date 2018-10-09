import { HostComponent, HostText, HostRoot } from 'shared/ReactWorkTags';
import { Deletion, Placement } from 'shared/ReactSideEffectTags';
import { createFiberFromHostInstanceForDeletion } from './ReactFiber';
import {
	shouldSetTextContent,
	supportsHydration,
	canHydrateInstance,
	canHydrateTextInstance,
	getNextHydratableSibling,
	getFirstHydratableChild,
	hydrateInstance,
	hydrateTextInstance
} from './ReactFiberHostConfig';

// The deepest Fiber on the stack involved in a hydration context.
// This may have been an insertion or a hydration.
let hydrationParentFiber = null;
let nextHydratableInstance = null;
let isHydrating = false;

function enterHydrationState(fiber) {
	if (!supportsHydration) {
		return false;
	}

	const parentInstance = fiber.stateNode.containerInfo;
	nextHydratableInstance = getFirstHydratableChild(parentInstance);
	hydrationParentFiber = fiber;
	isHydrating = true;
	return true;
}

function deleteHydratableInstance(returnFiber, instance) {
	const childToDelete = createFiberFromHostInstanceForDeletion();
	childToDelete.stateNode = instance;
	childToDelete.return = returnFiber;
	childToDelete.effectTag = Deletion;

	// This might seem like it belongs on progressedFirstDeletion. However,
	// these children are not part of the reconciliation list of children.
	// Even if we abort and rereconcile the children, that will try to hydrate
	// again and the nodes are still in the host tree so these will be
	// recreated.
	if (returnFiber.lastEffect !== null) {
		returnFiber.lastEffect.nextEffect = childToDelete;
		returnFiber.lastEffect = childToDelete;
	} else {
		returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
	}
}

function insertNonHydratedInstance(returnFiber, fiber) {
	fiber.effectTag |= Placement;
}

function tryHydrate(fiber, nextInstance) {
	switch (fiber.tag) {
		case HostComponent: {
			const type = fiber.type;
			const props = fiber.pendingProps;
			const instance = canHydrateInstance(nextInstance, type, props);
			if (instance !== null) {
				fiber.stateNode = instance;
				return true;
			}
			return false;
		}
		case HostText: {
			const text = fiber.pendingProps;
			const textInstance = canHydrateTextInstance(nextInstance, text);
			if (textInstance !== null) {
				fiber.stateNode = textInstance;
				return true;
			}
			return false;
		}
		default:
			return false;
	}
}

function tryToClaimNextHydratableInstance(fiber) {
	if (!isHydrating) {
		return;
	}
	let nextInstance = nextHydratableInstance;
	if (!nextInstance) {
		// Nothing to hydrate. Make it an insertion.
		insertNonHydratedInstance((hydrationParentFiber: any), fiber);
		isHydrating = false;
		hydrationParentFiber = fiber;
		return;
	}
	const firstAttemptedInstance = nextInstance;
	if (!tryHydrate(fiber, nextInstance)) {
		// If we can't hydrate this instance let's try the next one.
		// We use this as a heuristic. It's based on intuition and not data so it
		// might be flawed or unnecessary.
		nextInstance = getNextHydratableSibling(firstAttemptedInstance);
		if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
			// Nothing to hydrate. Make it an insertion.
			insertNonHydratedInstance((hydrationParentFiber), fiber);
			isHydrating = false;
			hydrationParentFiber = fiber;
			return;
		}
		// We matched the next one, we'll now assume that the first one was
		// superfluous and we'll delete it. Since we can't eagerly delete it
		// we'll have to schedule a deletion. To do that, this node needs a dummy
		// fiber associated with it.
		deleteHydratableInstance((hydrationParentFiber), firstAttemptedInstance);
	}
	hydrationParentFiber = fiber;
	nextHydratableInstance = getFirstHydratableChild((nextInstance));
}

function prepareToHydrateHostInstance(fiber, rootContainerInstance, hostContext) {
	const instance = fiber.stateNode;
	const updatePayload = hydrateInstance(
		instance,
		fiber.type,
		fiber.memoizedProps,
		rootContainerInstance,
		hostContext,
		fiber
	);
	// TODO: Type this specific to this type of component.
	fiber.updateQueue = (updatePayload);
	// If the update payload indicates that there is a change or if there
	// is a new ref we mark this as an update.
	if (updatePayload !== null) {
		return true;
	}
	return false;
}

function prepareToHydrateHostTextInstance(fiber) {
	
	const textInstance = fiber.stateNode;
	const textContent = fiber.memoizedProps;
	const shouldUpdate = hydrateTextInstance(textInstance, textContent, fiber);
	
	return shouldUpdate;
}

function popToNextHostParent(fiber) {
	let parent = fiber.return;
	while (parent !== null && parent.tag !== HostComponent && parent.tag !== HostRoot) {
		parent = parent.return;
	}
	hydrationParentFiber = parent;
}

function popHydrationState(fiber) {
	if (!supportsHydration) {
		return false;
	}
	if (fiber !== hydrationParentFiber) {
		// We're deeper than the current hydration context, inside an inserted
		// tree.
		return false;
	}
	if (!isHydrating) {
		// If we're not currently hydrating but we're in a hydration context, then
		// we were an insertion and now need to pop up reenter hydration of our
		// siblings.
		popToNextHostParent(fiber);
		isHydrating = true;
		return false;
	}

	const type = fiber.type;

	// If we have any remaining hydratable nodes, we need to delete them now.
	// We only do this deeper than head and body since they tend to have random
	// other nodes in them. We also ignore components with pure text content in
	// side of them.
	// TODO: Better heuristic.
	if (
		fiber.tag !== HostComponent ||
		(type !== 'head' && type !== 'body' && !shouldSetTextContent(type, fiber.memoizedProps))
	) {
		let nextInstance = nextHydratableInstance;
		while (nextInstance) {
			deleteHydratableInstance(fiber, nextInstance);
			nextInstance = getNextHydratableSibling(nextInstance);
		}
	}

	popToNextHostParent(fiber);
	nextHydratableInstance = hydrationParentFiber ? getNextHydratableSibling(fiber.stateNode) : null;
	return true;
}

function resetHydrationState() {
	if (!supportsHydration) {
		return;
	}

	hydrationParentFiber = null;
	nextHydratableInstance = null;
	isHydrating = false;
}

export {
	enterHydrationState,
	resetHydrationState,
	tryToClaimNextHydratableInstance,
	prepareToHydrateHostInstance,
	prepareToHydrateHostTextInstance,
	popHydrationState,
};
