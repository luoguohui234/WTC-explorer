# wtc-exporter
### 用来查看以太坊WTC币交易情况

## 使用说明

推荐系统: Ubuntu 16.04

1. 安装nodejs和npm
2. 安装以太坊节点Geth
3. 运行`geth --syncmode=full`并完全同步数据（耗时很长的步骤）
4. 克隆项目: `git clone https://github.com/luoguohui234/wtc-explorer.git`
5. 安装mongodb，启动mongodb后台服务`sudo service mongodb start`
5. 安装项目依赖: `npm install`
7. 启动程序: `npm start`
8. 在浏览器中访问 `http://localhost:3000`


## 运行说明

程序启动后将自动读取以太坊的数据，将WTC的交易记录插入到mongodb中，需要大约三十分钟
程序将在mongodb中生成几个集合：

1. balance：存储每个账户的最终余额
2. record: 存储每笔交易后的账户余额和时间戳，方便开发每日余额状态图
3. tx: 存储以太坊中的Transfer和Approval事件记录
4. state：保存同步过程中的中间状态，如果同步未完成，重新启动程序时可以继续
