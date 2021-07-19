import { strict as assert } from 'assert';
import { isKeyObject } from 'util/types';
import {
    transformReplyBoolean,
    transformReplyBooleanArray,
    pushScanArguments,
    transformReplyNumberInfinity,
    transformReplyNumberInfinityArray,
    transformReplyNumberInfinityNull,
    transformArgumentNumberInfinity,
    transformReplyTuples,
    transformReplyTuplesNull,
    transformReplyStreamMessages,
    transformReplyStreamsMessages,
    transformReplyStreamsMessagesNull,
    transformReplySortedSetWithScores,
    pushGeoCountArgument,
    pushGeoSearchArguments,
    transformGeoMembersWithReply,
    GeoReplyWith
} from './generic-transformers';

describe('Generic Transformers', () => {
    describe('transformReplyBoolean', () => {
        it('0', () => {
            assert.equal(
                transformReplyBoolean(0),
                false
            );
        });

        it('1', () => {
            assert.equal(
                transformReplyBoolean(1),
                true
            );
        });
    });

    describe('transformReplyBooleanArray', () => {
        it('empty array', () => {
            assert.deepEqual(
                transformReplyBooleanArray([]),
                []
            );
        });

        it('0, 1', () => {
            assert.deepEqual(
                transformReplyBooleanArray([0, 1]),
                [false, true]
            );
        });
    });

    describe('pushScanArguments', () => {
        it('cusror only', () => {
            assert.deepEqual(
                pushScanArguments([], 0),
                ['0']
            );
        });

        it('with MATCH', () => {
            assert.deepEqual(
                pushScanArguments([], 0, {
                    MATCH: 'pattern'
                }),
                ['0', 'MATCH', 'pattern']
            );
        });

        it('with COUNT', () => {
            assert.deepEqual(
                pushScanArguments([], 0, {
                    COUNT: 1
                }),
                ['0', 'COUNT', '1']
            );
        });

        it('with MATCH & COUNT', () => {
            assert.deepEqual(
                pushScanArguments([], 0, {
                    MATCH: 'pattern',
                    COUNT: 1
                }),
                ['0', 'MATCH', 'pattern', 'COUNT', '1']
            );
        });
    });

    describe('transformReplyNumberInfinity', () => {
        it('0.5', () => {
            assert.equal(
                transformReplyNumberInfinity('0.5'),
                0.5
            );
        });

        it('+inf', () => {
            assert.equal(
                transformReplyNumberInfinity('+inf'),
                Infinity
            );
        });

        it('-inf', () => {
            assert.equal(
                transformReplyNumberInfinity('-inf'),
                -Infinity
            );
        });
    });

    describe('transformReplyNumberInfinityArray', () => {
        it('empty array', () => {
            assert.deepEqual(
                transformReplyNumberInfinityArray([]),
                []
            );
        });

        it('0.5, +inf, -inf', () => {
            assert.deepEqual(
                transformReplyNumberInfinityArray(['0.5', '+inf', '-inf']),
                [0.5, Infinity, -Infinity]
            );
        });
    });

    it('transformReplyNumberInfinityNull', () => {
        assert.equal(
            transformReplyNumberInfinityNull(null),
            null
        );
    });

    describe('transformArgumentNumberInfinity', () => {
        it('0.5', () => {
            assert.equal(
                transformArgumentNumberInfinity(0.5),
                '0.5'
            );
        });

        it('Infinity', () => {
            assert.equal(
                transformArgumentNumberInfinity(Infinity),
                '+inf'
            );
        });

        it('-Infinity', () => {
            assert.equal(
                transformArgumentNumberInfinity(-Infinity),
                '-inf'
            );
        });
    });

    it('transformReplyTuples', () => {
        assert.deepEqual(
            transformReplyTuples(['key1', 'value1', 'key2', 'value2']),
            Object.create(null, {
                key1: {
                    value: 'value1',
                    configurable: true,
                    enumerable: true
                },
                key2: {
                    value: 'value2',
                    configurable: true,
                    enumerable: true
                }
            })
        );
    });

    it('transformReplyTuplesNull', () => {
        assert.equal(
            transformReplyTuplesNull(null),
            null
        );
    });

    it('transformReplyStreamMessages', () => {
        assert.deepEqual(
            transformReplyStreamMessages(['0-0', ['0key', '0value'], '1-0', ['1key', '1value']]),
            [{
                id: '0-0',
                message: Object.create(null, {
                    '0key': {
                        value: '0value',
                        configurable: true,
                        enumerable: true
                    }
                })
            }, {
                id: '1-0',
                message: Object.create(null, {
                    '1key': {
                        value: '1value',
                        configurable: true,
                        enumerable: true
                    }
                })
            }]
        );
    });

    it('transformReplyStreamsMessages', () => {
        assert.deepEqual(
            transformReplyStreamsMessages([['stream1', ['0-1', ['11key', '11value'], '1-1', ['12key', '12value']]], ['stream2', ['0-2', ['2key1', '2value1', '2key2', '2value2']]]]),
            [{
                name: 'stream1',
                messages: [{
                    id: '0-1',
                    message: Object.create(null, {
                        '11key': {
                            value: '11value',
                            configurable: true,
                            enumerable: true
                        }
                    })
                }, {
                    id: '1-1',
                    message: Object.create(null, {
                        '12key': {
                            value: '12value',
                            configurable: true,
                            enumerable: true
                        }
                    })
                }]
            }, {
                name: 'stream2',
                messages: [{
                    id: '0-2',
                    message: Object.create(null, {
                        '2key1': {
                            value: '2value1',
                            configurable: true,
                            enumerable: true
                        },
                        '2key2': {
                            value: '2value2',
                            configurable: true,
                            enumerable: true
                        }
                    })
                }]
            }]
        )
    });

    it('transformReplyStreamsMessagesNull', () => {
        assert.equal(
            transformReplyStreamsMessagesNull(null),
            null
        );
    });

    it('transformReplySortedSetWithScores', () => {
        assert.deepEqual(
            transformReplySortedSetWithScores(['member1', '0.5', 'member2', '+inf', 'member3', '-inf']),
            [{
                value: 'member1',
                score: 0.5
            }, {
                value: 'member2',
                score: Infinity
            }, {
                value: 'member3',
                score: -Infinity
            }]
        );
    });

    describe('pushGeoCountArgument', () => {
        it('undefined', () => {
            assert.deepEqual(
                pushGeoCountArgument([], undefined),
                []
            );
        });

        it('number', () => {
            assert.deepEqual(
                pushGeoCountArgument([], 1),
                ['COUNT', '1']
            );
        });

        it('with ANY', () => {
            assert.deepEqual(
                pushGeoCountArgument([], {
                    value: 1,
                    ANY: true
                }),
                ['COUNT', '1', 'ANY']
            );
        });
    });

    describe('pushGeoSearchArguments', () => {
        it('FROMMEMBER, BYRADIUS', () => {
            assert.deepEqual(
                pushGeoSearchArguments([], 'key', 'member', {
                    radius: 1,
                    unit: 'm'
                }),
                ['key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm']
            );
        });

        it('FROMLONLAT, BYBOX', () => {
            assert.deepEqual(
                pushGeoSearchArguments([], 'key', {
                    longitude: 1,
                    latitude: 2
                }, {
                    width: 1,
                    height: 2,
                    unit: 'm'
                }),
                ['key', 'FROMLONLAT', '1', '2', 'BYBOX', '1', '2', 'm']
            );
        });

        it('with SORT', () => {
            assert.deepEqual(
                pushGeoSearchArguments([], 'key', 'member', {
                    radius: 1,
                    unit: 'm'
                }, {
                    SORT: 'ASC'
                }),
                ['key', 'FROMMEMBER', 'member', 'BYRADIUS', '1', 'm', 'ASC']
            );
        });
    });

    describe('transformGeoMembersWithReply', () => {
        it('DISTANCE', () => {
            assert.deepEqual(
                transformGeoMembersWithReply([
                    [
                        '1',
                        '2'
                    ],
                    [
                        '3',
                        '4'
                    ]
                ], [GeoReplyWith.DISTANCE]),
                [{
                    member: '1',
                    distance: '2'
                }, {
                    member: '3',
                    distance: '4'
                }]
            );
        });

        it('HASH', () => {
            assert.deepEqual(
                transformGeoMembersWithReply([
                    [
                        '1',
                        2
                    ],
                    [
                        '3',
                        4
                    ]
                ], [GeoReplyWith.HASH]),
                [{
                    member: '1',
                    hash: 2
                }, {
                    member: '3',
                    hash: 4
                }]
            );
        });

        it('COORDINATES', () => {
            assert.deepEqual(
                transformGeoMembersWithReply([
                    [
                        '1',
                        [
                            '2',
                            '3'
                        ]
                    ],
                    [
                        '4',
                        [
                            '5',
                            '6'
                        ]
                    ]
                ], [GeoReplyWith.COORDINATES]),
                [{
                    member: '1',
                    coordinates: {
                        longitude: '2',
                        latitude: '3'
                    }
                }, {
                    member: '4',
                    coordinates: {
                        longitude: '5',
                        latitude: '6'
                    }
                }]
            );
        });

        it('DISTANCE, HASH, COORDINATES', () => {
            assert.deepEqual(
                transformGeoMembersWithReply([
                    [
                        '1',
                        '2',
                        3,
                        [
                            '4',
                            '5'
                        ]
                    ],
                    [
                        '6',
                        '7',
                        8,
                        [
                            '9',
                            '10'
                        ]
                    ]
                ], [GeoReplyWith.DISTANCE, GeoReplyWith.HASH, GeoReplyWith.COORDINATES]),
                [{
                    member: '1',
                    distance: '2',
                    hash: 3,
                    coordinates: {
                        longitude: '4',
                        latitude: '5'
                    }
                }, {
                    member: '6',
                    distance: '7',
                    hash: 8,
                    coordinates: {
                        longitude: '9',
                        latitude: '10'
                    }
                }]
            );
        });
    });
});
