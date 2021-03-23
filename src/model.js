const model = {
    table: null,
    setTable: (table) => {
        this.table = table
    },
    getNextIndex: async () => {
        await this.table.add('index', 1)
        return this.table.get('index')
    },

    getSupportIdByUser: (user) => this.table.get(`user_${user}`),
    setSupportIdByUser: (user, supportId) => this.table.set(`user_${user}`, supportId),
    deleteUserSupport: (user) => this.table.delete(`user_${user}`),
    
    getSupport: (id) => this.table.get(`support_${id}`),
    setSupport: (id, support) => this.table.set(`support_${id}`, support),
    deleteSupport: (id) => this.table.delete(`support_${id}`),
    
    getSupportByUser: (user) => this.getSupportById(this.getSupportIdByUser(user)),
    getUserBySupportId: (id) => this.getSupportById(id).user,

    pauseSupport: (supportId) => this.table.set(`paused_${supportId}`, true),
    unPauseSupport: (supportId) => this.table.delete(`paused_${supportId}`),
    isSupportPaused: (supportId) => this.table.get(`paused_${supportId}`),

    blockSupport: (supportId) => this.table.set(`blocked_${supportId}`, true),
    unBlockSupport: (supportId) => this.table.delete(`blocked_${supportId}`),
    isSupportBlocked: (supportId) => this.table.get(`blocked_${supportId}`),
    
    closeSupport: (supportId) => this.table.set(`closed_${supportId}`, true),
    unCloseSupport: (supportId) => this.table.delete(`closed_${supportId}`),
    isSupportClosed: (supportId) => this.table.get(`closed_${supportId}`),

    setSupportStatus: (supportId, status) => this.table.set(`status_${supportId}`, status),
    getSupportStatus: (supportId) => this.table.get(`status_${supportId}`),
    deleteSupportStatus: (supportId) => this.table.delete(`status_${supportId}`),

}

module.exports = model