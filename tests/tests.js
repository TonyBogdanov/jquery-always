"use strict";
(function ($, assert) {
    var Callback = (function () {
        function Callback(callback) {
            this.invoked = 0;
            this.callback = callback;
        }
        Callback.prototype.invoke = function () {
            this.callback.apply(this, arguments);
            this.invoked++;
        };
        Callback.prototype.getInvoked = function () {
            return this.invoked;
        };
        return Callback;
    }());
    var Utils = (function () {
        function Utils() {
        }
        Utils.createCallbacks = function () {
            return {
                a: new Callback(function () { }),
                b: new Callback(function () { }),
                div: new Callback(function () { })
            };
        };
        Utils.invokeCallbacks = function (callbacks) {
            return function () {
                callbacks[this.tagName.toLowerCase()].invoke();
            };
        };
        Utils.assertInvoked = function (callbacks, a, b, div, prefix) {
            assert.equal(callbacks.a.getInvoked(), a, (prefix ? prefix + ': ' : '') + 'Callback #a must be invoked ' + a + ' time(s) total');
            assert.equal(callbacks.b.getInvoked(), b, (prefix ? prefix + ': ' : '') + 'Callback #b must be invoked ' + b + ' time(s) total');
            assert.equal(callbacks.div.getInvoked(), div, (prefix ? prefix + ': ' : '') + 'Callback #div must be invoked ' + div + ' time(s) total');
        };
        Utils.wait = function (frames, callback) {
            if (frames <= 0) {
                callback();
            }
            else {
                if ('function' === typeof window.requestAnimationFrame) {
                    requestAnimationFrame(function () {
                        Utils.wait(frames - 1, callback);
                    });
                }
                else {
                    setTimeout(function () {
                        Utils.wait(frames - 1, callback);
                    }, 1000 / 60);
                }
            }
        };
        return Utils;
    }());
    var $fixture, $a, $b, $div;
    beforeEach(function () {
        $fixture = $('<div/>');
        $a = $('<a/>');
        $b = $('<b/>');
        $div = $('<div/>');
        $(document.body).append($fixture);
    });
    afterEach(function () {
        $fixture.remove();
    });
    describe('jQuery.Always', function () {
        it('Dependencies have resolved', function () {
            var mo = typeof MutationObserver, wmo = typeof WebKitMutationObserver;
            assert.isTrue('undefined' !== mo || 'undefined' !== wmo, 'Browser must support mutation observer feature,' +
                ' typeof MutationObserver is ' + mo + ', typeof WebKitMutationObserver is ' + wmo);
        });
        it('Plugin has registered', function () {
            assert.isFunction($.fn.always, 'always() must be registered with jQuery');
            assert.isFunction($.fn.never, 'never() must be registered with jQuery');
        });
        it('"Inserted" callbacks are executed for matching selectors (before registration)', function (done) {
            var callbacks = Utils.createCallbacks();
            $fixture
                .append($a)
                .append($b)
                .append($div)
                .always('a, b', Utils.invokeCallbacks(callbacks));
            Utils.wait(1, function () {
                Utils.assertInvoked(callbacks, 1, 1, 0);
                done();
            });
        });
        it('"Inserted" callbacks are executed for matching selectors (after registration)', function (done) {
            var callbacks = Utils.createCallbacks();
            $fixture
                .always('a, b', Utils.invokeCallbacks(callbacks))
                .append($a)
                .append($b)
                .append($div);
            Utils.wait(1, function () {
                Utils.assertInvoked(callbacks, 1, 1, 0);
                done();
            });
        });
        it('"Removed" callbacks are executed for matching selectors', function (done) {
            var callbacks = Utils.createCallbacks();
            $fixture
                .append($a)
                .append($b)
                .append($div)
                .always('a, b', undefined, Utils.invokeCallbacks(callbacks));
            $a.remove();
            $b.remove();
            Utils.wait(1, function () {
                Utils.assertInvoked(callbacks, 1, 1, 0);
                done();
            });
        });
        it('Callbacks are also executed for selectors matching children (deep) of mutated elements', function (done) {
            var insertedCallbacks = Utils.createCallbacks(), removedCallbacks = Utils.createCallbacks(), $aWrapper = $('<span/>'), $bWrapper = $('<span/>'), $divWrapper = $('<span/>');
            $aWrapper.append($('<span/>').append($a.clone()).append($('<span/>').append($a.clone())));
            $bWrapper.append($('<span/>').append($b.clone()).append($('<span/>').append($b.clone())));
            $divWrapper.append($('<span/>').append($div.clone()).append($('<span/>').append($div.clone())));
            $fixture
                .always('a, b', Utils.invokeCallbacks(insertedCallbacks), Utils.invokeCallbacks(removedCallbacks))
                .append($aWrapper)
                .append($bWrapper)
                .append($divWrapper);
            Utils.wait(1, function () {
                Utils.assertInvoked(insertedCallbacks, 2, 2, 0);
                Utils.assertInvoked(removedCallbacks, 0, 0, 0);
                $aWrapper.children().children().last().remove();
                $bWrapper.remove();
                $divWrapper.remove();
                Utils.wait(1, function () {
                    Utils.assertInvoked(insertedCallbacks, 2, 2, 0);
                    Utils.assertInvoked(removedCallbacks, 1, 2, 0);
                    done();
                });
            });
        });
        it('Calling never() stops execution of all callbacks', function (done) {
            var insertedCallbacks = Utils.createCallbacks(), removedCallbacks = Utils.createCallbacks();
            $fixture
                .always('a, b', Utils.invokeCallbacks(insertedCallbacks), Utils.invokeCallbacks(removedCallbacks))
                .append($a)
                .append($b)
                .append($div);
            Utils.wait(1, function () {
                Utils.assertInvoked(insertedCallbacks, 1, 1, 0, 'Pre-Never (Inserted)');
                $a.remove();
                $b.remove();
                $div.remove();
                Utils.wait(1, function () {
                    Utils.assertInvoked(removedCallbacks, 1, 1, 0, 'Pre-Never (Removed)');
                    $fixture
                        .never()
                        .append($a)
                        .append($b)
                        .append($div);
                    Utils.wait(1, function () {
                        Utils.assertInvoked(insertedCallbacks, 1, 1, 0, 'Post-Never (Inserted)');
                        $a.remove();
                        $b.remove();
                        $div.remove();
                        Utils.wait(1, function () {
                            Utils.assertInvoked(removedCallbacks, 1, 1, 0, 'Post-Never (Removed)');
                            done();
                        });
                    });
                });
            });
        });
        it('Calling never(selector) stops execution of matching callbacks', function (done) {
            var callbacksAB = Utils.createCallbacks(), callbacksDIV = Utils.createCallbacks();
            $fixture
                .always('a, b', Utils.invokeCallbacks(callbacksAB))
                .always('div', Utils.invokeCallbacks(callbacksDIV))
                .append($a)
                .append($b)
                .append($div);
            Utils.wait(1, function () {
                Utils.assertInvoked(callbacksAB, 1, 1, 0, 'Pre-Never (A,B)');
                Utils.assertInvoked(callbacksDIV, 0, 0, 1, 'Pre-Never (DIV)');
                $a.remove();
                $b.remove();
                $div.remove();
                $fixture
                    .never('b,a')
                    .append($a)
                    .append($b)
                    .append($div);
                Utils.wait(1, function () {
                    Utils.assertInvoked(callbacksAB, 1, 1, 0, 'Post-Never (A,B)');
                    Utils.assertInvoked(callbacksDIV, 0, 0, 2, 'Post-Never (DIV)');
                    done();
                });
            });
        });
        it('Calling never(selector, insertedCallback, removedCallback) stops execution of exact callback(s)', function (done) {
            var callbacksInsertedA = Utils.createCallbacks(), callbacksInsertedB = Utils.createCallbacks(), callbacksRemovedDIV = Utils.createCallbacks(), _callbacksInsertedA = Utils.invokeCallbacks(callbacksInsertedA), _callbacksInsertedB = Utils.invokeCallbacks(callbacksInsertedB), _callbacksRemovedDIV = Utils.invokeCallbacks(callbacksRemovedDIV);
            $fixture
                .always('a', _callbacksInsertedA)
                .always('b', _callbacksInsertedB)
                .always('div', undefined, _callbacksRemovedDIV)
                .append($a)
                .append($b)
                .append($div);
            $div.remove();
            Utils.wait(1, function () {
                Utils.assertInvoked(callbacksInsertedA, 1, 0, 0, 'Pre-Never (A)');
                Utils.assertInvoked(callbacksInsertedB, 0, 1, 0, 'Pre-Never (B)');
                Utils.assertInvoked(callbacksRemovedDIV, 0, 0, 1, 'Pre-Never (DIV)');
                $a.remove();
                $b.remove();
                $fixture
                    .never('a', _callbacksInsertedA)
                    .append($a)
                    .append($b)
                    .append($div);
                $div.remove();
                Utils.wait(1, function () {
                    Utils.assertInvoked(callbacksInsertedA, 1, 0, 0, 'Post-Never (A)');
                    Utils.assertInvoked(callbacksInsertedB, 0, 2, 0, 'Post-Never (B)');
                    Utils.assertInvoked(callbacksRemovedDIV, 0, 0, 2, 'Post-Never (DIV)');
                    $a.remove();
                    $b.remove();
                    $fixture
                        .never('div', undefined, _callbacksRemovedDIV)
                        .append($a)
                        .append($b)
                        .append($div);
                    $div.remove();
                    Utils.wait(1, function () {
                        Utils.assertInvoked(callbacksInsertedA, 1, 0, 0, 'Post-Never (A)');
                        Utils.assertInvoked(callbacksInsertedB, 0, 3, 0, 'Post-Never (B)');
                        Utils.assertInvoked(callbacksRemovedDIV, 0, 0, 2, 'Post-Never (DIV)');
                        done();
                    });
                });
            });
        });
        it('Adding a second "inserted" callback eligible for immediate execution does not trigger re-execution of the first one', function (done) {
            var callbacks = Utils.createCallbacks();
            $fixture
                .append($a.attr('data-ab', ''))
                .append($b.attr('data-ab', ''))
                .append($div)
                .always('a', Utils.invokeCallbacks(callbacks))
                .always('[data-ab]', Utils.invokeCallbacks(callbacks));
            Utils.wait(1, function () {
                Utils.assertInvoked(callbacks, 2, 1, 0);
                done();
            });
        });
    });
})(jQuery, chai.assert);