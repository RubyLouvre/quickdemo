

import {
	unstable_scheduleCallback as Schedule_scheduleCallback,
	unstable_cancelCallback as Schedule_cancelCallback,
} from 'scheduler';
import {
	invokeGuardedCallback,
	hasCaughtError,
	clearCaughtError,
} from 'shared/ReactErrorUtils';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
	NoEffect,
	PerformedWork,
	Placement,
	Update,
	Snapshot,
	PlacementAndUpdate,
	Deletion,
	ContentReset,
	Callback,
	DidCapture,
	Ref,
	Incomplete,
	HostEffectMask,
	Passive,
} from 'shared/ReactSideEffectTags';
import {
	ClassComponent,
	HostRoot,

} from 'shared/ReactWorkTags';

import invariant from 'shared/invariant';

import {
	now,
	scheduleDeferredCallback,
	cancelDeferredCallback,
	shouldYield,
	prepareForCommit,
	resetAfterCommit,
	scheduleTimeout,
	cancelTimeout,
	noTimeout,
} from './ReactFiberHostConfig';
import {
	markPendingPriorityLevel,
	markCommittedPriorityLevels,
	markSuspendedPriorityLevel,
	markPingedPriorityLevel,
	hasLowerPriorityWork,
	isPriorityLevelSuspended,
	findEarliestOutstandingPriorityLevel,
	didExpireAtExpirationTime,
} from './ReactFiberPendingPriority';

import { createWorkInProgress } from './ReactFiber';
import { onCommitRoot } from './ReactFiberDevToolsHook';
import {
	NoWork,
	Sync,
	Never,
	msToExpirationTime,
	expirationTimeToMs,
	computeAsyncExpiration,
	computeInteractiveExpiration,
} from './ReactFiberExpirationTime';
/*
export const NoWork = 0;
export const Never = 1;
export const Sync = MAX_SIGNED_31_BIT_INT;
*/
import { ConcurrentMode, NoContext } from './ReactTypeOfMode';
import {
	enqueueUpdate,
	ForceUpdate,
	createUpdate,
} from './ReactUpdateQueue';
import { createCapturedValue } from './ReactCapturedValue';

import { popProvider, resetContextDependences } from './ReactFiberNewContext';
import { resetHooks } from './ReactFiberHooks';

import {
	checkThatStackIsEmpty,
	resetStackAfterFatalErrorInDev,
} from './ReactFiberStack';
import { beginWork } from './ReactFiberBeginWork';
import { completeWork } from './ReactFiberCompleteWork';
import {
	throwException,
	unwindWork,
	unwindInterruptedWork,
	createRootErrorUpdate,
	createClassErrorUpdate,
} from './ReactFiberUnwindWork';
import {
	commitBeforeMutationLifeCycles,
	commitResetTextContent,
	commitPlacement,
	commitDeletion,
	commitWork,
	commitLifeCycles,
	commitAttachRef,
	commitDetachRef,
	commitPassiveHookEffects,
} from './ReactFiberCommitWork';
import { Dispatcher } from './ReactFiberDispatcher';


const { ReactCurrentOwner } = ReactSharedInternals;


// Used to ensure computeUniqueAsyncExpiration is monotonically decreasing.
let lastUniqueAsyncExpiration = Sync - 1;

// Represents the expiration time that incoming updates should use. (If this
// is NoWork, use the default strategy: async updates in async mode, sync
// updates in sync mode.)
let expirationContext = NoWork;//

let isWorking = false;//它会在renderRoot与commitRoot中变成true, computeExpirationForFiber， scheduleWork，commitRoot，renderRoot

// The next work in progress fiber that we're currently working on.
let nextUnitOfWork = null;
let nextRoot = null;
// The time at which we're currently rendering work.
let nextRenderExpirationTime = NoWork;
let nextLatestAbsoluteTimeoutMs = -1;
let nextRenderDidError = false;

// The next fiber with an effect that we're currently committing.
let nextEffect = null;

let isCommitting = false;
let rootWithPendingPassiveEffects = null;
let passiveEffectCallbackHandle = null;
let passiveEffectCallback = null;

let legacyErrorBoundariesThatAlreadyFailed = null;

// 决定是否调用渲染引擎与何时调起 some point in the future.
function requestWork(root, expirationTime) {
	//设置全局变量firstScheduledRoot，lastScheduledRoot及root与.lastScheduledRootnextScheduledRoot = root;
	addRootToSchedule(root, expirationTime);
	if (isRendering) { //不调起
		return;
	}
	if (isBatchingUpdates) {
		if (isUnbatchingUpdates) { //立即调起
			nextFlushedRoot = root;
			nextFlushedExpirationTime = Sync;
			performWorkOnRoot(root, Sync, false);
		}
		return;
	}
	// TODO: Get rid of Sync and use current time?
	if (expirationTime === Sync) { //立即调起
		performSyncWork();
	} else {
		scheduleCallbackWithExpirationTime(root, expirationTime);//延迟调起
	}
}


function performSyncWork() {
	performWork(Sync, false);
}
//这个方法是找到nextFlushedRoot，nextFlushedExpirationTime 丢到performWorkOnRoot方法中执行
function performWork(minExpirationTime, isYieldy) {
	// 调整nextFlushedRoot，nextFlushedExpirationTime 
	findHighestPriorityRoot();

	if (isYieldy) {
		recomputeCurrentRendererTime();
		currentSchedulerTime = currentRendererTime;
		while (
			nextFlushedRoot !== null &&
			nextFlushedExpirationTime !== NoWork &&
			minExpirationTime <= nextFlushedExpirationTime &&
			!(didYield && currentRendererTime > nextFlushedExpirationTime)
		) {
			performWorkOnRoot(
				nextFlushedRoot,
				nextFlushedExpirationTime,
				currentRendererTime > nextFlushedExpirationTime,
			);
			findHighestPriorityRoot();
			recomputeCurrentRendererTime();
			currentSchedulerTime = currentRendererTime;
		}
	} else {
		while (
			nextFlushedRoot !== null &&
			nextFlushedExpirationTime !== NoWork &&
			minExpirationTime <= nextFlushedExpirationTime
		) {
			performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime, false);
			findHighestPriorityRoot();
		}
	}

	// We're done flushing work. Either we ran out of time in this callback,
	// or there's no more work left with sufficient priority.

	// If we're inside a callback, set this to false since we just completed it.
	if (isYieldy) {
		callbackExpirationTime = NoWork;
		callbackID = null;
	}
	// If there's work left over, schedule a new callback.
	if (nextFlushedExpirationTime !== NoWork) {
		scheduleCallbackWithExpirationTime(
			nextFlushedRoot,
			nextFlushedExpirationTime,
		);
	}

	// Clean-up.
	finishRendering();
}


function findHighestPriorityRoot() {
	let highestPriorityWork = NoWork;
	let highestPriorityRoot = null;
	if (lastScheduledRoot !== null) {
		let previousScheduledRoot = lastScheduledRoot;
		let root = firstScheduledRoot;
		while (root !== null) {
			const remainingExpirationTime = root.expirationTime;
			if (remainingExpirationTime === NoWork) {
				// This root no longer has work. Remove it from the scheduler.

				// TODO: This check is redudant, but Flow is confused by the branch
				// below where we set lastScheduledRoot to null, even though we break
				// from the loop right after.
				invariant(
					previousScheduledRoot !== null && lastScheduledRoot !== null,
					'Should have a previous and last root. This error is likely ' +
					'caused by a bug in React. Please file an issue.',
				);
				if (root === root.nextScheduledRoot) {
					// This is the only root in the list.
					root.nextScheduledRoot = null;
					firstScheduledRoot = lastScheduledRoot = null;
					break;
				} else if (root === firstScheduledRoot) {
					// This is the first root in the list.
					const next = root.nextScheduledRoot;
					firstScheduledRoot = next;
					lastScheduledRoot.nextScheduledRoot = next;
					root.nextScheduledRoot = null;
				} else if (root === lastScheduledRoot) {
					// This is the last root in the list.
					lastScheduledRoot = previousScheduledRoot;
					lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
					root.nextScheduledRoot = null;
					break;
				} else {
					previousScheduledRoot.nextScheduledRoot = root.nextScheduledRoot;
					root.nextScheduledRoot = null;
				}
				root = previousScheduledRoot.nextScheduledRoot;
			} else {
				if (remainingExpirationTime > highestPriorityWork) {
					// Update the priority, if it's higher
					highestPriorityWork = remainingExpirationTime;
					highestPriorityRoot = root;
				}
				if (root === lastScheduledRoot) {
					break;
				}
				if (highestPriorityWork === Sync) {
					// Sync is highest priority by definition so
					// we can stop searching.
					break;
				}
				previousScheduledRoot = root;
				root = root.nextScheduledRoot;
			}
		}
	}

	nextFlushedRoot = highestPriorityRoot;
	nextFlushedExpirationTime = highestPriorityWork;
}

//终于到performWorkOnRoot， 这个方法的最终目的地是 completeRoot，它有两条路，直接进入 completeRoot，还是通过
//renderRoot到completeRoot。从renderRoot到completeRoot是隔着一大堆方法workLoop， performUnitOfWork，beginWork，
// completeUnitOfWork， completeWork，这个过程其实是更新虚拟DOM树的过程。而completeRoot之后则是更新真实DOM的过程（如果它的底层是浏览器）
function performWorkOnRoot(
	root,
	expirationTime,
	isYieldy,
) {

	isRendering = true;
	let finishedWork = root.finishedWork;
	if (finishedWork !== null) {
		// This root is already complete. We can commit it.
		completeRoot(root, finishedWork, expirationTime);
	} else {
		root.finishedWork = null;
		// If this root previously suspended, clear its existing timeout, since
		// we're about to try rendering again.
		const timeoutHandle = root.timeoutHandle;
		if (timeoutHandle !== noTimeout) {
			root.timeoutHandle = noTimeout;
			// $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above
			cancelTimeout(timeoutHandle);
		}
		renderRoot(root, isYieldy);
		finishedWork = root.finishedWork;
		if (finishedWork !== null) {

			// We've completed the root. Commit it.
			if (!isYieldy) {
				completeRoot(root, finishedWork, expirationTime);
			} else {
				// We've completed the root. Check the if we should yield one more time
				// before committing.
				if (!shouldYieldToRenderer()) {
					// Still time left. Commit the root.
					completeRoot(root, finishedWork, expirationTime);
				} else {
					// There's no time left. Mark this root as complete. We'll come
					// back and commit it later.
					root.finishedWork = finishedWork;
				}
			}
		}
	}

	isRendering = false;
}


function renderRoot(root, isYieldy) {

	flushPassiveEffects();

	isWorking = true;
	ReactCurrentOwner.currentDispatcher = Dispatcher;//用于执行各种钩子

	const expirationTime = root.nextExpirationTimeToWorkOn;

	// Check if we're starting from a fresh stack, or if we're resuming from
	// previously yielded work.
	if (
		expirationTime !== nextRenderExpirationTime ||
		root !== nextRoot ||
		nextUnitOfWork === null
	) {
		// Reset the stack and start working from the root.
		resetStack();
		nextRoot = root;
		nextRenderExpirationTime = expirationTime;
		nextUnitOfWork = createWorkInProgress(
			nextRoot.current,
			null,
			nextRenderExpirationTime,
		);
		root.pendingCommitExpirationTime = NoWork;
	}

	let didFatal = false;


	do {
		try {
			workLoop(isYieldy);
		} catch (thrownValue) {
			resetContextDependences();
			resetHooks();

			if (nextUnitOfWork === null) {
				// This is a fatal error.
				didFatal = true;
				onUncaughtError(thrownValue);
			} else {

				const sourceFiber = nextUnitOfWork;
				let returnFiber = sourceFiber.return;
				if (returnFiber === null) {
					// This is the root. The root could capture its own errors. However,
					// we don't know if it errors before or after we pushed the host
					// context. This information is needed to avoid a stack mismatch.
					// Because we're not sure, treat this as a fatal error. We could track
					// which phase it fails in, but doesn't seem worth it. At least
					// for now.
					didFatal = true;
					onUncaughtError(thrownValue);
				} else {
					throwException(
						root,
						returnFiber,
						sourceFiber,
						thrownValue,
						nextRenderExpirationTime,
					);
					nextUnitOfWork = completeUnitOfWork(sourceFiber);
					continue;
				}
			}
		}
		break;
	} while (true);


	// We're done performing work. Time to clean up.
	isWorking = false;
	ReactCurrentOwner.currentDispatcher = null;
	resetContextDependences();
	resetHooks();

	// Yield back to main thread.
	if (didFatal) {
		// There was a fatal error.
		// `nextRoot` points to the in-progress root. A non-null value indicates
		// that we're in the middle of an async render. Set it to null to indicate
		// there's no more work to be done in the current batch.
		nextRoot = null;
		onFatal(root);
		return;
	}

	if (nextUnitOfWork !== null) {
		//在这棵树中仍然存在异步工作，但是我们在当前帧中没有时间。
		// 屈服回渲染器。 除非我们被更高优先级的更新打断，否则我们将在稍后停止的地方继续。
		onYield(root);
		return;
	}

	// We completed the whole tree.
	const rootWorkInProgress = root.current.alternate;
	

	// `nextRoot` points to the in-progress root. A non-null value indicates
	// that we're in the middle of an async render. Set it to null to indicate
	// there's no more work to be done in the current batch.
	nextRoot = null;

	if (nextRenderDidError) {
		// There was an error
		if (hasLowerPriorityWork(root, expirationTime)) {
			// There's lower priority work. If so, it may have the effect of fixing
			// the exception that was just thrown. Exit without committing. This is
			// similar to a suspend, but without a timeout because we're not waiting
			// for a promise to resolve. React will restart at the lower
			// priority level.
			markSuspendedPriorityLevel(root, expirationTime);
			const suspendedExpirationTime = expirationTime;
			const rootExpirationTime = root.expirationTime;
			onSuspend(
				root,
				rootWorkInProgress,
				suspendedExpirationTime,
				rootExpirationTime,
				-1, // Indicates no timeout
			);
			return;
		} else if (
			// There's no lower priority work, but we're rendering asynchronously.
			// Synchronsouly attempt to render the same level one more time. This is
			// similar to a suspend, but without a timeout because we're not waiting
			// for a promise to resolve.
			!root.didError &&
			isYieldy
		) {
			root.didError = true;
			const suspendedExpirationTime = (root.nextExpirationTimeToWorkOn = expirationTime);
			const rootExpirationTime = (root.expirationTime = Sync);
			onSuspend(
				root,
				rootWorkInProgress,
				suspendedExpirationTime,
				rootExpirationTime,
				-1, // Indicates no timeout
			);
			return;
		}
	}

	if (isYieldy && nextLatestAbsoluteTimeoutMs !== -1) {
		// The tree was suspended.
		const suspendedExpirationTime = expirationTime;
		markSuspendedPriorityLevel(root, suspendedExpirationTime);

		// Find the earliest uncommitted expiration time in the tree, including
		// work that is suspended. The timeout threshold cannot be longer than
		// the overall expiration.
		const earliestExpirationTime = findEarliestOutstandingPriorityLevel(
			root,
			expirationTime,
		);
		const earliestExpirationTimeMs = expirationTimeToMs(earliestExpirationTime);
		if (earliestExpirationTimeMs < nextLatestAbsoluteTimeoutMs) {
			nextLatestAbsoluteTimeoutMs = earliestExpirationTimeMs;
		}

		// Subtract the current time from the absolute timeout to get the number
		// of milliseconds until the timeout. In other words, convert an absolute
		// timestamp to a relative time. This is the value that is passed
		// to `setTimeout`.
		const currentTimeMs = expirationTimeToMs(requestCurrentTime());
		let msUntilTimeout = nextLatestAbsoluteTimeoutMs - currentTimeMs;
		msUntilTimeout = msUntilTimeout < 0 ? 0 : msUntilTimeout;

		// TODO: Account for the Just Noticeable Difference

		const rootExpirationTime = root.expirationTime;
		onSuspend(
			root,
			rootWorkInProgress,
			suspendedExpirationTime,
			rootExpirationTime,
			msUntilTimeout,
		);
		return;
	}

	// Ready to commit.
	onComplete(root, rootWorkInProgress, expirationTime);
}

function resetStack() {
	if (nextUnitOfWork !== null) {
		let interruptedWork = nextUnitOfWork.return;
		while (interruptedWork !== null) {
			unwindInterruptedWork(interruptedWork);//处理错误
			interruptedWork = interruptedWork.return;
		}
	}
	nextRoot = null;
	nextRenderExpirationTime = NoWork;
	nextLatestAbsoluteTimeoutMs = -1;
	nextRenderDidError = false;
	nextUnitOfWork = null;
}


function workLoop(isYieldy) {//遍历整个虚拟DOM 树
	if (!isYieldy) { //同步不会中断
		// Flush work without yielding
		while (nextUnitOfWork !== null) {
			nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		}
	} else {//异步会中断
		while (nextUnitOfWork !== null && !shouldYieldToRenderer()) {
			nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		}
	}
}

//终于不是只处理根节点了
function performUnitOfWork(workInProgress) {
	// The current, flushed, state of this fiber is the alternate.
	// Ideally nothing should rely on this, but relying on it here
	// means that we don't need an additional field on the work in
	// progress.
	const current = workInProgress.alternate;
	let next;

	next = beginWork(current, workInProgress, nextRenderExpirationTime);//返回它的第一个孩子
	workInProgress.memoizedProps = workInProgress.pendingProps;

	if (next === null) {
		// 返回它的兄弟与父亲
		next = completeUnitOfWork(workInProgress);
	}

	ReactCurrentOwner.current = null;

	return next;
}



function completeUnitOfWork(workInProgress) {
	// Attempt to complete the current unit of work, then move to the
	// next sibling. If there are no more siblings, return to the
	// parent fiber.
	while (true) {
		// The current, flushed, state of this fiber is the alternate.
		// Ideally nothing should rely on this, but relying on it here
		// means that we don't need an additional field on the work in
		// progress.
		const current = workInProgress.alternate;

		const returnFiber = workInProgress.return;
		const siblingFiber = workInProgress.sibling;

		if ((workInProgress.effectTag & Incomplete) === NoEffect) {
			// This fiber completed.

			nextUnitOfWork = completeWork(
				current,
				workInProgress,
				nextRenderExpirationTime,
			);

			resetChildExpirationTime(workInProgress, nextRenderExpirationTime);
			if (nextUnitOfWork !== null) {
				// Completing this fiber spawned new work. Work on that next.
				nextUnitOfWork.firstEffect = nextUnitOfWork.lastEffect = null;
				return nextUnitOfWork;
			  }
		

			if (
				returnFiber !== null &&
				// Do not append effects to parents if a sibling failed to complete
				(returnFiber.effectTag & Incomplete) === NoEffect
			) {
				// Append all the effects of the subtree and this fiber onto the effect
				// list of the parent. The completion order of the children affects the
				// side-effect order.
				if (returnFiber.firstEffect === null) {
					returnFiber.firstEffect = workInProgress.firstEffect;
				}
				if (workInProgress.lastEffect !== null) {
					if (returnFiber.lastEffect !== null) {
						returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
					}
					returnFiber.lastEffect = workInProgress.lastEffect;
				}

				// If this fiber had side-effects, we append it AFTER the children's
				// side-effects. We can perform certain side-effects earlier if
				// needed, by doing multiple passes over the effect list. We don't want
				// to schedule our own side-effect on our own list because if end up
				// reusing children we'll schedule this effect onto itself since we're
				// at the end.
				const effectTag = workInProgress.effectTag;
				// Skip both NoWork and PerformedWork tags when creating the effect list.
				// PerformedWork effect is read by React DevTools but shouldn't be committed.
				if (effectTag > PerformedWork) {
					if (returnFiber.lastEffect !== null) {
						returnFiber.lastEffect.nextEffect = workInProgress;
					} else {
						returnFiber.firstEffect = workInProgress;
					}
					returnFiber.lastEffect = workInProgress;
				}
			}


			if (siblingFiber !== null) {
				// If there is more work to do in this returnFiber, do that next.
				return siblingFiber;
			} else if (returnFiber !== null) {
				// If there's no more work in this returnFiber. Complete the returnFiber.
				workInProgress = returnFiber;
				continue;
			} else {
				// We've reached the root.
				return null;
			}
		} else {
			
			// This fiber did not complete because something threw. Pop values off
			// the stack without entering the complete phase. If this is a boundary,
			// capture values if possible.
			const next = unwindWork(workInProgress, nextRenderExpirationTime);
			// Because this fiber did not complete, don't reset its expiration time.

			if (next !== null) {
				// If completing this work spawned new work, do that next. We'll come
				// back here again.
				// Since we're restarting, remove anything that is not a host effect
				// from the effect tag.
				next.effectTag &= HostEffectMask;
				return next;
			}

			if (returnFiber !== null) {
				// Mark the parent fiber as incomplete and clear its effect list.
				returnFiber.firstEffect = returnFiber.lastEffect = null;
				returnFiber.effectTag |= Incomplete;
			}


			if (siblingFiber !== null) {
				// If there is more work to do in this returnFiber, do that next.
				return siblingFiber;
			} else if (returnFiber !== null) {
				// If there's no more work in this returnFiber. Complete the returnFiber.
				workInProgress = returnFiber;
				continue;
			} else {
				return null;
			}
		}
	}
	// Without this explicit null return Flow complains of invalid return type
	// TODO Remove the above while(true) loop
	// eslint-disable-next-line no-unreachable
	return null;
}



function resetChildExpirationTime(
	workInProgress,
	renderTime,
) {
	if (renderTime !== Never && workInProgress.childExpirationTime === Never) {
		// The children of this component are hidden. Don't bubble their
		// expiration times.
		return;
	}

	let newChildExpirationTime = NoWork;

	// Bubble up the earliest expiration time.

	let child = workInProgress.child;
	while (child !== null) {
		const childUpdateExpirationTime = child.expirationTime;
		const childChildExpirationTime = child.childExpirationTime;
		if (childUpdateExpirationTime > newChildExpirationTime) {
			newChildExpirationTime = childUpdateExpirationTime;
		}
		if (childChildExpirationTime > newChildExpirationTime) {
			newChildExpirationTime = childChildExpirationTime;
		}
		child = child.sibling;
	}

	workInProgress.childExpirationTime = newChildExpirationTime;
}

//主要调整全局的completedBatches 数组，并调用commitRoot
function completeRoot(
	root,
	finishedWork,
	expirationTime,
) {
	// Check if there's a batch that matches this expiration time.
	const firstBatch = root.firstBatch;
	if (firstBatch !== null && firstBatch._expirationTime >= expirationTime) {
		if (completedBatches === null) {
			completedBatches = [firstBatch];
		} else {
			completedBatches.push(firstBatch);
		}
		if (firstBatch._defer) {
			// This root is blocked from committing by a batch. Unschedule it until
			// we receive another update.
			root.finishedWork = finishedWork;
			root.expirationTime = NoWork;
			return;
		}
	}

	// Commit the root.
	root.finishedWork = null;

	commitRoot(root, finishedWork);
}


function commitRoot(root, finishedWork) {
	isWorking = true;
	isCommitting = true;

	invariant(
		root.current !== finishedWork,
		'Cannot commit the same tree as before. This is probably a bug ' +
		'related to the return field. This error is likely caused by a bug ' +
		'in React. Please file an issue.',
	);

	root.pendingCommitExpirationTime = NoWork;

	// 更新 the pending priority levels 来记录这个工件单元准备 commit
	// 我们必须在生命周期钩子执行前干这事，因为它们会触发多余的更新 
	const updateExpirationTimeBeforeCommit = finishedWork.expirationTime;
	const childExpirationTimeBeforeCommit = finishedWork.childExpirationTime;
	//earliestRemainingTimeBeforeCommit 要找晚的时间点
	const earliestRemainingTimeBeforeCommit =
		childExpirationTimeBeforeCommit > updateExpirationTimeBeforeCommit
			? childExpirationTimeBeforeCommit
			: updateExpirationTimeBeforeCommit;
	markCommittedPriorityLevels(root, earliestRemainingTimeBeforeCommit);

	// Reset this to null before calling lifecycles
	ReactCurrentOwner.current = null;

	let firstEffect;
	if (finishedWork.effectTag > PerformedWork) {
		// A fiber's effect list consists only of its children, not itself. So if
		// the root has an effect, we need to add it to the end of the list. The
		// resulting list is the set that would belong to the root's parent, if
		// it had one; that is, all the effects in the tree including the root.
		if (finishedWork.lastEffect !== null) {
			finishedWork.lastEffect.nextEffect = finishedWork;
			firstEffect = finishedWork.firstEffect;
		} else {
			firstEffect = finishedWork;
		}
	} else {
		// There is no effect on the root.
		firstEffect = finishedWork.firstEffect;
	}

	prepareForCommit(root.containerInfo);

	// Invoke instances of getSnapshotBeforeUpdate before mutation.
	nextEffect = firstEffect;
	while (nextEffect !== null) {
		let didError = false;
		let error;

		try {
			commitBeforeMutationLifecycles();
		} catch (e) {
			didError = true;
			error = e;
		}

		if (didError) {
			invariant(
				nextEffect !== null,
				'Should have next effect. This error is likely caused by a bug ' +
				'in React. Please file an issue.',
			);
			captureCommitPhaseError(nextEffect, error);
			// Clean-up
			if (nextEffect !== null) {
				nextEffect = nextEffect.nextEffect;
			}
		}
	}


	// Commit all the side-effects within a tree. We'll do this in two passes.
	// The first pass performs all the host insertions, updates, deletions and
	// ref unmounts.
	nextEffect = firstEffect;
	while (nextEffect !== null) {
		let didError = false;
		let error;

		try {
			commitAllHostEffects();
		} catch (e) {
			didError = true;
			error = e;
		}

		if (didError) {
			invariant(
				nextEffect !== null,
				'Should have next effect. This error is likely caused by a bug ' +
				'in React. Please file an issue.',
			);
			captureCommitPhaseError(nextEffect, error);
			// Clean-up
			if (nextEffect !== null) {
				nextEffect = nextEffect.nextEffect;
			}
		}
	}

	resetAfterCommit(root.containerInfo);

	// The work-in-progress tree is now the current tree. This must come after
	// the first pass of the commit phase, so that the previous tree is still
	// current during componentWillUnmount, but before the second pass, so that
	// the finished work is current during componentDidMount/Update.
	root.current = finishedWork;

	// In the second pass we'll perform all life-cycles and ref callbacks.
	// Life-cycles happen as a separate pass so that all placements, updates,
	// and deletions in the entire tree have already been invoked.
	// This pass also triggers any renderer-specific initial effects.
	nextEffect = firstEffect;
	while (nextEffect !== null) {
		let didError = false;
		let error;

		try {
			commitAllLifeCycles(root, committedExpirationTime);
		} catch (e) {
			didError = true;
			error = e;
		}

		if (didError) {
			invariant(
				nextEffect !== null,
				'Should have next effect. This error is likely caused by a bug ' +
				'in React. Please file an issue.',
			);
			captureCommitPhaseError(nextEffect, error);
			if (nextEffect !== null) {
				nextEffect = nextEffect.nextEffect;
			}
		}
	}

	if (firstEffect !== null && rootWithPendingPassiveEffects !== null) {
		// This commit included a passive effect. These do not need to fire until
		// after the next paint. Schedule an callback to fire them in an async
		// event. To ensure serial execution, the callback will be flushed early if
		// we enter rootWithPendingPassiveEffects commit phase before then.
		let callback = commitPassiveEffects.bind(null, root, firstEffect);

		passiveEffectCallbackHandle = Schedule_scheduleCallback(callback);
		passiveEffectCallback = callback;
	}

	isCommitting = false;
	isWorking = false;
	//给DevTools调用
	onCommitRoot(finishedWork.stateNode);

	const updateExpirationTimeAfterCommit = finishedWork.expirationTime;
	const childExpirationTimeAfterCommit = finishedWork.childExpirationTime;
	const earliestRemainingTimeAfterCommit =
		childExpirationTimeAfterCommit > updateExpirationTimeAfterCommit
			? childExpirationTimeAfterCommit
			: updateExpirationTimeAfterCommit;
	if (earliestRemainingTimeAfterCommit === NoWork) {
		// If there's no remaining work, we can clear the set of already failed
		// error boundaries.
		legacyErrorBoundariesThatAlreadyFailed = null;
	}
	onCommit(root, earliestRemainingTimeAfterCommit);

}

// For every call to renderRoot, one of onFatal, onComplete, onSuspend, and
// onYield is called upon exiting. We use these in lieu of returning a tuple.
// I've also chosen not to inline them into renderRoot because these will
// eventually be lifted into the renderer.
function onFatal(root) {
	root.finishedWork = null;
}

function onComplete(
	root,
	finishedWork,
	expirationTime,
) {
	root.pendingCommitExpirationTime = expirationTime;
	root.finishedWork = finishedWork;
}

function onSuspend(
	root,
	finishedWork,
	suspendedExpirationTime,
	rootExpirationTime,
	msUntilTimeout,
) {
	root.expirationTime = rootExpirationTime;
	if (msUntilTimeout === 0 && !shouldYieldToRenderer()) {
		// Don't wait an additional tick. Commit the tree immediately.
		root.pendingCommitExpirationTime = suspendedExpirationTime;
		root.finishedWork = finishedWork;
	} else if (msUntilTimeout > 0) {
		// Wait `msUntilTimeout` milliseconds before committing.
		root.timeoutHandle = scheduleTimeout(
			onTimeout.bind(null, root, finishedWork, suspendedExpirationTime),
			msUntilTimeout,
		);
	}
}

function onYield(root) {
	root.finishedWork = null;
}

function onTimeout(root, finishedWork, suspendedExpirationTime) {
	// The root timed out. Commit it.
	root.pendingCommitExpirationTime = suspendedExpirationTime;
	root.finishedWork = finishedWork;
	// Read the current time before entering the commit phase. We can be
	// certain this won't cause tearing related to batching of event updates
	// because we're at the top of a timer event.
	recomputeCurrentRendererTime();
	currentSchedulerTime = currentRendererTime;
	flushRoot(root, suspendedExpirationTime);
}

function onCommit(root, expirationTime) {
	root.expirationTime = expirationTime;
	root.finishedWork = null;
}


//提交DOM相关的处理指令
function commitAllHostEffects() {
	while (nextEffect !== null) {


		const effectTag = nextEffect.effectTag;

		if (effectTag & ContentReset) {
			commitResetTextContent(nextEffect);
		}

		if (effectTag & Ref) {
			const current = nextEffect.alternate;
			if (current !== null) {
				commitDetachRef(current);
			}
		}

		// The following switch statement is only concerned about placement,
		// updates, and deletions. To avoid needing to add a case for every
		// possible bitmap value, we remove the secondary effects from the
		// effect tag and switch on that value.
		let primaryEffectTag = effectTag & (Placement | Update | Deletion);
		switch (primaryEffectTag) {
			case Placement: {
				commitPlacement(nextEffect);
				// Clear the "placement" from effect tag so that we know that this is inserted, before
				// any life-cycles like componentDidMount gets called.
				// TODO: findDOMNode doesn't rely on this any more but isMounted
				// does and isMounted is deprecated anyway so we should be able
				// to kill this.
				nextEffect.effectTag &= ~Placement;
				break;
			}
			case PlacementAndUpdate: {
				// Placement
				commitPlacement(nextEffect);
				// Clear the "placement" from effect tag so that we know that this is inserted, before
				// any life-cycles like componentDidMount gets called.
				nextEffect.effectTag &= ~Placement;

				// Update
				const current = nextEffect.alternate;
				commitWork(current, nextEffect);
				break;
			}
			case Update: {
				const current = nextEffect.alternate;
				commitWork(current, nextEffect);
				break;
			}
			case Deletion: {
				commitDeletion(nextEffect);
				break;
			}
		}
		nextEffect = nextEffect.nextEffect;
	}


}
//提交执行UnmountSnapshot, NoHookEffect Hooks与getSnapshotBeforeUpdate的指令
function commitBeforeMutationLifecycles() {
	while (nextEffect !== null) {
		const effectTag = nextEffect.effectTag;
		if (effectTag & Snapshot) {
			const current = nextEffect.alternate;
			commitBeforeMutationLifeCycles(current, nextEffect);
		}

		nextEffect = nextEffect.nextEffect;
	}


}
//提交执行UnmountLayout, MountLayout Hooks与componentDidMount componentDidUpdate的指令
function commitAllLifeCycles(
	finishedRootRoot,
	committedExpirationTime,
) {

	while (nextEffect !== null) {
		const effectTag = nextEffect.effectTag;

		if (effectTag & (Update | Callback)) {
			const current = nextEffect.alternate;
			commitLifeCycles(
				finishedRoot,
				current,
				nextEffect,
				committedExpirationTime,
			);
		}

		if (effectTag & Ref) {
			commitAttachRef(nextEffect);
		}

		if (effectTag & Passive) {
			rootWithPendingPassiveEffects = finishedRoot;
		}

		nextEffect = nextEffect.nextEffect;
	}
}

function commitPassiveEffects(rootRoot, firstEffect) {
	rootWithPendingPassiveEffects = null;
	passiveEffectCallbackHandle = null;
	passiveEffectCallback = null;

	// Set this to true to prevent re-entrancy
	const previousIsRendering = isRendering;
	isRendering = true;

	let effect = firstEffect;
	do {
		if (effect.effectTag & Passive) {
			let didError = false;
			let error;

			try {//提交一些钩子
				commitPassiveHookEffects(effect);
			} catch (e) {
				didError = true;
				error = e;
			}

			if (didError) {
				captureCommitPhaseError(effect, error);
			}
		}
		effect = effect.nextEffect;
	} while (effect !== null);

	isRendering = previousIsRendering;

	// Check if work was scheduled by one of the effects
	const rootExpirationTime = root.expirationTime;
	if (rootExpirationTime !== NoWork) {
		requestWork(root, rootExpirationTime);
	}
}

function isAlreadyFailedLegacyErrorBoundary(instance) {
	return (
		legacyErrorBoundariesThatAlreadyFailed !== null &&
		legacyErrorBoundariesThatAlreadyFailed.has(instance)
	);
}

function markLegacyErrorBoundaryAsFailed(instance) {
	if (legacyErrorBoundariesThatAlreadyFailed === null) {
		legacyErrorBoundariesThatAlreadyFailed = new Set([instance]);
	} else {
		legacyErrorBoundariesThatAlreadyFailed.add(instance);
	}
}

function flushPassiveEffects() {
	if (passiveEffectCallback !== null) {
		Schedule_cancelCallback(passiveEffectCallbackHandle);
		// We call the scheduled callback instead of commitPassiveEffects directly
		// to ensure tracing works correctly.
		passiveEffectCallback();
	}
}

function captureCommitPhaseError(sourceFiber, value) {
	const expirationTime = Sync;
	let fiber = sourceFiber.return;
	while (fiber !== null) {
		switch (fiber.tag) {
			case ClassComponent:
				const ctor = fiber.type;
				const instance = fiber.stateNode;
				if (
					typeof ctor.getDerivedStateFromError === 'function' ||
					(typeof instance.componentDidCatch === 'function' &&
						!isAlreadyFailedLegacyErrorBoundary(instance))
				) {
					const errorInfo = createCapturedValue(value, sourceFiber);
					const update = createClassErrorUpdate(
						fiber,
						errorInfo,
						expirationTime,
					);
					enqueueUpdate(fiber, update);
					scheduleWork(fiber, expirationTime);
					return;
				}
				break;
			case HostRoot: {
				const errorInfo = createCapturedValue(value, sourceFiber);
				const update = createRootErrorUpdate(fiber, errorInfo, expirationTime);
				enqueueUpdate(fiber, update);
				scheduleWork(fiber, expirationTime);
				return;
			}
		}
		fiber = fiber.return;
	}

	if (sourceFiber.tag === HostRoot) {
		// Error was thrown at the root. There is no parent, so the root
		// itself should capture it.
		const rootFiber = sourceFiber;
		const errorInfo = createCapturedValue(value, rootFiber);
		const update = createRootErrorUpdate(rootFiber, errorInfo, expirationTime);
		enqueueUpdate(rootFiber, update);
		scheduleWork(rootFiber, expirationTime);
	}
}


// Creates a unique async expiration time.
function computeUniqueAsyncExpiration() {
	const currentTime = requestCurrentTime();
	let result = computeAsyncExpiration(currentTime);
	if (result >= lastUniqueAsyncExpiration) {
		// Since we assume the current time monotonically increases, we only hit
		// this branch when computeUniqueAsyncExpiration is fired multiple times
		// within a 200ms window (or whatever the async bucket size is).
		result = lastUniqueAsyncExpiration - 1;
	}
	lastUniqueAsyncExpiration = result;
	return lastUniqueAsyncExpiration;
}

function computeExpirationForFiber(currentTime, fiber) {
	let expirationTime;
	if (expirationContext !== NoWork) {
		// An explicit expiration context was set;
		expirationTime = expirationContext;
	} else if (isWorking) {
		if (isCommitting) {
			// Updates that occur during the commit phase should have sync priority
			// by default.
			expirationTime = Sync;
		} else {
			// Updates during the render phase should expire at the same time as
			// the work that is being rendered.
			expirationTime = nextRenderExpirationTime;
		}
	} else {
		// No explicit expiration context was set, and we're not currently
		// performing work. Calculate a new expiration time.
		if (fiber.mode & ConcurrentMode) {
			if (isBatchingInteractiveUpdates) {
				// This is an interactive update
				expirationTime = computeInteractiveExpiration(currentTime);
			} else {
				// This is an async update
				expirationTime = computeAsyncExpiration(currentTime);
			}
			// If we're in the middle of rendering a tree, do not update at the same
			// expiration time that is already rendering.
			if (nextRoot !== null && expirationTime === nextRenderExpirationTime) {
				expirationTime -= 1;
			}
		} else {
			// This is a sync update
			expirationTime = Sync;
		}
	}
	if (isBatchingInteractiveUpdates) {
		// This is an interactive update. Keep track of the lowest pending
		// interactive expiration time. This allows us to synchronously flush
		// all interactive updates when needed.
		if (
			lowestPriorityPendingInteractiveExpirationTime === NoWork ||
			expirationTime < lowestPriorityPendingInteractiveExpirationTime
		) {
			lowestPriorityPendingInteractiveExpirationTime = expirationTime;
		}
	}
	return expirationTime;
}

function renderDidSuspend(
	root,
	absoluteTimeoutMs,
	suspendedTime,
) {
	// Schedule the timeout.
	if (
		absoluteTimeoutMs >= 0 &&
		nextLatestAbsoluteTimeoutMs < absoluteTimeoutMs
	) {
		nextLatestAbsoluteTimeoutMs = absoluteTimeoutMs;
	}
}

function renderDidError() {
	nextRenderDidError = true;
}

function retrySuspendedRoot(
	root,
	boundaryFiber,
	sourceFiber,
	suspendedTime,
) {
	let retryTime;

	if (isPriorityLevelSuspended(root, suspendedTime)) {
		// Ping at the original level
		retryTime = suspendedTime;

		markPingedPriorityLevel(root, retryTime);
	} else {
		// Suspense already timed out. Compute a new expiration time
		const currentTime = requestCurrentTime();
		retryTime = computeExpirationForFiber(currentTime, boundaryFiber);
		markPendingPriorityLevel(root, retryTime);
	}

	// TODO: If the suspense fiber has already rendered the primary children
	// without suspending (that is, all of the promises have already resolved),
	// we should not trigger another update here. One case this happens is when
	// we are in sync mode and a single promise is thrown both on initial render
	// and on update; we attach two .then(retrySuspendedRoot) callbacks and each
	// one performs Sync work, rerendering the Suspense.

	if ((boundaryFiber.mode & ConcurrentMode) !== NoContext) {
		if (root === nextRoot && nextRenderExpirationTime === suspendedTime) {
			// Received a ping at the same priority level at which we're currently
			// rendering. Restart from the root.
			nextRoot = null;
		}
	}

	scheduleWorkToRoot(boundaryFiber, retryTime);
	if ((boundaryFiber.mode & ConcurrentMode) === NoContext) {
		// Outside of concurrent mode, we must schedule an update on the source
		// fiber, too, since it already committed in an inconsistent state and
		// therefore does not have any pending work.
		scheduleWorkToRoot(sourceFiber, retryTime);
		const sourceTag = sourceFiber.tag;
		if (sourceTag === ClassComponent && sourceFiber.stateNode !== null) {
			// When we try rendering again, we should not reuse the current fiber,
			// since it's known to be in an inconsistent state. Use a force updte to
			// prevent a bail out.
			const update = createUpdate(retryTime);
			update.tag = ForceUpdate;
			enqueueUpdate(sourceFiber, update);
		}
	}

	const rootExpirationTime = root.expirationTime;
	if (rootExpirationTime !== NoWork) {
		requestWork(root, rootExpirationTime);
	}
}

function scheduleWorkToRoot(fiber, expirationTime) {
	// 设置fiber改其备胎的过期时间为传入的过期时间
	if (fiber.expirationTime < expirationTime) {
		fiber.expirationTime = expirationTime;
	}
	let alternate = fiber.alternate;
	if (alternate !== null && alternate.expirationTime < expirationTime) {
		alternate.expirationTime = expirationTime;
	}
	let node = fiber.return;
	let root = null;
	if (node === null && fiber.tag === HostRoot) {
		root = fiber.stateNode;
	} else {
		//将它的所有父节点及父节点的childExpirationTime设置为传入的过期时间，并一直找到根
		while (node !== null) {
			alternate = node.alternate;
			if (node.childExpirationTime < expirationTime) {
				node.childExpirationTime = expirationTime;
				if (
					alternate !== null &&
					alternate.childExpirationTime < expirationTime
				) {
					alternate.childExpirationTime = expirationTime;
				}
			} else if (
				alternate !== null &&
				alternate.childExpirationTime < expirationTime
			) {
				alternate.childExpirationTime = expirationTime;
			}
			if (node.return === null && node.tag === HostRoot) {
				root = node.stateNode;
				break;
			}
			node = node.return;
		}
	}

	return root;
}

function scheduleWork(fiber, expirationTime) {
	const root = scheduleWorkToRoot(fiber, expirationTime);
	if (root === null) {
		return;
	}

	if (
		!isWorking &&
		nextRenderExpirationTime !== NoWork &&
		expirationTime > nextRenderExpirationTime
	) {
		resetStack();
	}
	markPendingPriorityLevel(root, expirationTime);
	if (
		// If we're in the render phase, we don't need to schedule this root
		// for an update, because we'll do it before we exit...
		//如果在准备阶段或commitRoot阶段或渲染另一个节点
		!isWorking ||
		isCommitting ||
		// ...unless this is a different root than the one we're rendering.
		nextRoot !== root
	) {
		const rootExpirationTime = root.expirationTime;
		requestWork(root, rootExpirationTime);
	}

}





// TODO: Everything below this is written as if it has been lifted to the
// renderers. I'll do this in a follow-up.

// Linked-list of roots
let firstScheduledRoot = null;
let lastScheduledRoot = null;

let callbackExpirationTime = NoWork;
let callbackID = 0;
let isRendering = false;
let nextFlushedRoot = null;
let nextFlushedExpirationTime = NoWork;
let lowestPriorityPendingInteractiveExpirationTime = NoWork;
let hasUnhandledError = false;
let unhandledError = null;

let isBatchingUpdates = false;
let isUnbatchingUpdates = false;
let isBatchingInteractiveUpdates = false;

let completedBatches = null;

let originalStartTimeMs = now();
let currentRendererTime = msToExpirationTime(
	originalStartTimeMs,
);
let currentSchedulerTime = currentRendererTime;

// Use these to prevent an infinite loop of nested updates

function recomputeCurrentRendererTime() {
	const currentTimeMs = now() - originalStartTimeMs;
	currentRendererTime = msToExpirationTime(currentTimeMs);
}

function scheduleCallbackWithExpirationTime(
	rootRoot,
	expirationTime,
) {
	if (callbackExpirationTime !== NoWork) {
		// A callback is already scheduled. Check its expiration time (timeout).
		if (expirationTime < callbackExpirationTime) {
			// Existing callback has sufficient timeout. Exit.
			return;
		} else {
			if (callbackID !== null) {
				// Existing callback has insufficient timeout. Cancel and schedule a
				// new one.
				cancelDeferredCallback(callbackID);
			}
		}
		// The request callback timer is already running. Don't start a new one.
	}

	callbackExpirationTime = expirationTime;
	const currentMs = now() - originalStartTimeMs;
	const expirationTimeMs = expirationTimeToMs(expirationTime);
	const timeout = expirationTimeMs - currentMs;
	callbackID = scheduleDeferredCallback(performAsyncWork, { timeout });
}


function requestCurrentTime() {
	/*

调度程序调用RealestCurrnTimeTimes来计算过期时间。



到期时间是通过加到当前时间（开始时间）来计算的。然而，如果在同一事件中调度了两个更新，那么我们应该将它们的开始时间视为同时的，
即使实际时钟时间在第一次和第二次调用之间已经提前了。



换句话说，因为过期时间决定了更新如何批处理，所以我们希望在同一事件中发生的相同优先级的所有更新都接收相同的过期时间。否则我们会被撕裂。


我们跟踪两个不同的时间：当前的“渲染”时间和当前的“调度”时间。渲染时间可以随时更新；它只存在以最小化performance.now。

但是，只有当没有未决工作或者我们确实知道我们不在事件中间时，才能更新调度器时间。


	*/
	// requestCurrentTime is called by the scheduler to compute an expiration
	// time.
	//
	// Expiration times are computed by adding to the current time (the start
	// time). However, if two updates are scheduled within the same event, we
	// should treat their start times as simultaneous, even if the actual clock
	// time has advanced between the first and second call.

	// In other words, because expiration times determine how updates are batched,
	// we want all updates of like priority that occur within the same event to
	// receive the same expiration time. Otherwise we get tearing.
	//
	// We keep track of two separate times: the current "renderer" time and the
	// current "scheduler" time. The renderer time can be updated whenever; it
	// only exists to minimize the calls performance.now.
	//
	// But the scheduler time can only be updated if there's no pending work, or
	// if we know for certain that we're not in the middle of an event.

	if (isRendering) {
		// We're already rendering. Return the most recently read time.
		return currentSchedulerTime;
	}
	// Check if there's pending work.
	findHighestPriorityRoot();
	if (
		nextFlushedExpirationTime === NoWork ||
		nextFlushedExpirationTime === Never
	) {
		// If there's no pending work, or if the pending work is offscreen, we can
		// read the current time without risk of tearing.
		recomputeCurrentRendererTime();
		currentSchedulerTime = currentRendererTime;
		return currentSchedulerTime;
	}
	// There's already pending work. We might be in the middle of a browser
	// event. If we were to read the current time, it could cause multiple updates
	// within the same event to receive different expiration times, leading to
	// tearing. Return the last read time. During the next idle callback, the
	// time will be updated.
	return currentSchedulerTime;
}


//requestWork里面有一个addRootToSchedule，它会改写firstScheduledRoot， 
//lastScheduledRoot，并为它们添加nextScheduledRoot属性。

function addRootToSchedule(root, expirationTime) {
	// Add the root to the schedule.
	// Check if this root is already part of the schedule.
	if (root.nextScheduledRoot === null) {
		// This root is not already scheduled. Add it.
		root.expirationTime = expirationTime;
		if (lastScheduledRoot === null) {
			firstScheduledRoot = lastScheduledRoot = root;
			root.nextScheduledRoot = root;
		} else {
			lastScheduledRoot.nextScheduledRoot = root;
			lastScheduledRoot = root;
			lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
		}
	} else {
		// This root is already scheduled, but its priority may have increased.
		const remainingExpirationTime = root.expirationTime;
		if (expirationTime > remainingExpirationTime) {
			// Update the priority.
			root.expirationTime = expirationTime;
		}
	}
}


// TODO: This wrapper exists because many of the older tests (the ones that use
// flushDeferredPri) rely on the number of times `shouldYield` is called. We
// should get rid of it.
let didYield = false;
function shouldYieldToRenderer() {
	if (didYield) {
		return true;
	}
	if (shouldYield()) {
		didYield = true;
		return true;
	}
	return false;
}

function performAsyncWork() {
	try {
		if (!shouldYieldToRenderer()) {
			// The callback timed out. That means at least one update has expired.
			// Iterate through the root schedule. If they contain expired work, set
			// the next render expiration time to the current time. This has the effect
			// of flushing all expired work in a single batch, instead of flushing each
			// level one at a time.
			if (firstScheduledRoot !== null) {
				recomputeCurrentRendererTime();
				let root = firstScheduledRoot;
				do {
					didExpireAtExpirationTime(root, currentRendererTime);
					// The root schedule is circular, so this is never null.
					root = root.nextScheduledRoot;
				} while (root !== firstScheduledRoot);
			}
		}
		performWork(NoWork, true);
	} finally {
		didYield = false;
	}
}


function flushRoot(rootRoot, expirationTime) {
	invariant(
		!isRendering,
		'work.commit(): Cannot commit while already rendering. This likely ' +
		'means you attempted to commit from inside a lifecycle method.',
	);
	// Perform work on root as if the given expiration time is the current time.
	// This has the effect of synchronously flushing all work up to and
	// including the given time.
	nextFlushedRoot = root;
	nextFlushedExpirationTime = expirationTime;
	performWorkOnRoot(root, expirationTime, false);
	// Flush any sync work that was scheduled by lifecycles
	performSyncWork();
}

function finishRendering() {
	if (completedBatches !== null) {
		const batches = completedBatches;
		completedBatches = null;
		for (let i = 0; i < batches.length; i++) {
			const batch = batches[i];
			try {
				batch._onComplete();
			} catch (error) {
				if (!hasUnhandledError) {
					hasUnhandledError = true;
					unhandledError = error;
				}
			}
		}
	}
	if (hasUnhandledError) {
		const error = unhandledError;
		unhandledError = null;
		hasUnhandledError = false;
		throw error;
	}
}



function onUncaughtError(error) {
	invariant(
		nextFlushedRoot !== null,
		'Should be working on a root. This error is likely caused by a bug in ' +
		'React. Please file an issue.',
	);
	// Unschedule this root so we don't work on it again until there's
	// another update.
	nextFlushedRoot.expirationTime = NoWork;
	if (!hasUnhandledError) {
		hasUnhandledError = true;
		unhandledError = error;
	}
}




//执行方法并维护之前的expirationContext
function syncUpdates(fn, a, b, c, d) {
	const previousExpirationContext = expirationContext;
	expirationContext = Sync;
	try {
		return fn(a, b, c, d);
	} finally {
		expirationContext = previousExpirationContext;
	}
}
// TODO: Batching should be implemented at the renderer level, not inside
// the reconciler.
// 执行方法并维护之前的expirationContext与isBatchingUpdates，并调用performSyncWork
function flushSync(fn, a) {
	const previousIsBatchingUpdates = isBatchingUpdates;
	isBatchingUpdates = true;
	try {
		return syncUpdates(fn, a);
	} finally {
		isBatchingUpdates = previousIsBatchingUpdates;
		performSyncWork();
	}
}
// TODO: Batching should be implemented at the renderer level, not inside
// the reconciler.
// 执行方法并维护之前的isBatchingUpdates，并选择性调用performSyncWork
function batchedUpdates(fn, a) {
	const previousIsBatchingUpdates = isBatchingUpdates;
	isBatchingUpdates = true;
	try {
		return fn(a);
	} finally {
		isBatchingUpdates = previousIsBatchingUpdates;
		if (!isBatchingUpdates && !isRendering) {
			performSyncWork();
		}
	}
}
// TODO: Batching should be implemented at the renderer level, not inside
// the reconciler.
function unbatchedUpdates(fn, a) {
	if (isBatchingUpdates && !isUnbatchingUpdates) {
		isUnbatchingUpdates = true;
		try {
			return fn(a);
		} finally {
			isUnbatchingUpdates = false;
		}
	}
	return fn(a);
}
// 执行方法并维护之前的expirationContext与isBatchingUpdates，并选择性调用performSyncWork
function flushControlled(fn) {
	const previousIsBatchingUpdates = isBatchingUpdates;
	isBatchingUpdates = true;
	try {
		syncUpdates(fn);
	} finally {
		isBatchingUpdates = previousIsBatchingUpdates;
		if (!isBatchingUpdates && !isRendering) {
			performSyncWork();
		}
	}
}
//一个非常高优先级的调用，用于事件系统
function interactiveUpdates(fn, a, b) {
	if (isBatchingInteractiveUpdates) {
		return fn(a, b);
	}
	// If there are any pending interactive updates, synchronously flush them.
	// This needs to happen before we read any handlers, because the effect of
	// the previous event may influence which handlers are called during
	// this event.
	if (
		!isBatchingUpdates &&
		!isRendering &&
		lowestPriorityPendingInteractiveExpirationTime !== NoWork
	) {
		// Synchronously flush pending interactive updates.
		performWork(lowestPriorityPendingInteractiveExpirationTime, false);
		lowestPriorityPendingInteractiveExpirationTime = NoWork;
	}
	const previousIsBatchingInteractiveUpdates = isBatchingInteractiveUpdates;
	const previousIsBatchingUpdates = isBatchingUpdates;
	isBatchingInteractiveUpdates = true;
	isBatchingUpdates = true;
	try {
		return fn(a, b);
	} finally {
		isBatchingInteractiveUpdates = previousIsBatchingInteractiveUpdates;
		isBatchingUpdates = previousIsBatchingUpdates;
		if (!isBatchingUpdates && !isRendering) {
			performSyncWork();
		}
	}
}
//如果不在渲染中，并且不在interactiveUpdates的回调中，直接进入performWork
function flushInteractiveUpdates() {
	if (
		!isRendering &&
		lowestPriorityPendingInteractiveExpirationTime !== NoWork
	) {
		// Synchronously flush pending interactive updates.
		performWork(lowestPriorityPendingInteractiveExpirationTime, false);
		lowestPriorityPendingInteractiveExpirationTime = NoWork;
	}
}



export {
	requestCurrentTime,
	computeExpirationForFiber,
	captureCommitPhaseError,
	onUncaughtError,
	renderDidSuspend,
	renderDidError,
	retrySuspendedRoot,
	markLegacyErrorBoundaryAsFailed,
	isAlreadyFailedLegacyErrorBoundary,
	scheduleWork,
	requestWork,
	flushRoot,
	batchedUpdates,
	unbatchedUpdates,
	flushSync,
	flushControlled,
	syncUpdates,
	interactiveUpdates,
	flushInteractiveUpdates,
	computeUniqueAsyncExpiration,
	flushPassiveEffects,
};