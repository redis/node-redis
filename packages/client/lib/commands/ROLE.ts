export const IS_READ_ONLY = true;

export function transformArguments(): Array<string> {
    return ['ROLE'];
}

interface RoleReplyInterface<T extends string> {
    role: T;
}

type RoleMasterRawReply = ['master', number, Array<[string, string, string]>];

interface RoleMasterReply extends RoleReplyInterface<'master'> {
    replicationOffest: number;
    replicas: Array<{
        ip: string;
        port: number;
        replicationOffest: number;
    }>;
}

type RoleReplicaState = 'connect' | 'connecting' | 'sync' | 'connected';

type RoleReplicaRawReply = ['slave', string, number, RoleReplicaState, number];

interface RoleReplicaReply extends RoleReplyInterface<'slave'>  {
    master: {
        ip: string;
        port: number;
    };
    state: RoleReplicaState;
    dataReceived: number;
}

type RoleSentinelRawReply = ['sentinel', Array<string>];

interface RoleSentinelReply extends RoleReplyInterface<'sentinel'>  {
    masterNames: Array<string>;
}

type RoleRawReply = RoleMasterRawReply | RoleReplicaRawReply | RoleSentinelRawReply;

type RoleReply = RoleMasterReply | RoleReplicaReply | RoleSentinelReply;

export function transformReply(reply: RoleRawReply): RoleReply {
    switch (reply[0]) {
        case 'master':
            return {
                role: 'master',
                replicationOffest: reply[1],
                replicas: reply[2].map(([ip, port, replicationOffest]) => ({
                    ip,
                    port: Number(port),
                    replicationOffest: Number(replicationOffest)
                }))
            };

        case 'slave':
            return {
                role: 'slave',
                master: {
                    ip: reply[1],
                    port: reply[2]
                },
                state: reply[3],
                dataReceived: reply[4]
            };

        case 'sentinel':
            return {
                role: 'sentinel',
                masterNames: reply[1]
            };
    }
}
