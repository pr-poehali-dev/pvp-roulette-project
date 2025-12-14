import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Player {
  id: string;
  name: string;
  balance: number;
  color: string;
  wins: number;
  losses: number;
}

interface Bet {
  playerId: string;
  amount: number;
}

interface Round {
  id: number;
  winner: string;
  totalPot: number;
  timestamp: string;
  participants: number;
}

const PLAYER_COLORS = ['#8B5CF6', '#D946EF', '#0EA5E9', '#F97316', '#10B981', '#F59E0B'];

const BOT_NAMES = [
  'Алекс', 'Макс', 'Дима', 'Саша', 'Никита', 'Данил',
  'Влад', 'Артём', 'Егор', 'Илья', 'Кирилл', 'Олег'
];

const Index = () => {
  const [currentPlayer] = useState<Player>({
    id: '1',
    name: 'Игрок 1',
    balance: 1000,
    color: PLAYER_COLORS[0],
    wins: 0,
    losses: 0
  });

  const [players, setPlayers] = useState<Player[]>([
    currentPlayer,
    { id: '2', name: 'Игрок 2', balance: 800, color: PLAYER_COLORS[1], wins: 0, losses: 0 },
    { id: '3', name: 'Игрок 3', balance: 1200, color: PLAYER_COLORS[2], wins: 0, losses: 0 }
  ]);

  const [bets, setBets] = useState<Bet[]>([]);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [rotation, setRotation] = useState(0);

  const totalPot = bets.reduce((sum, bet) => sum + bet.amount, 0);

  const getPlayerBet = (playerId: string) => {
    const bet = bets.find(b => b.playerId === playerId);
    return bet?.amount || 0;
  };

  const getWinChance = (playerId: string) => {
    if (totalPot === 0) return 0;
    const playerBet = getPlayerBet(playerId);
    return (playerBet / totalPot) * 100;
  };

  const placeBet = () => {
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }
    if (amount > currentPlayer.balance) {
      toast.error('Недостаточно средств');
      return;
    }

    const existingBet = bets.find(b => b.playerId === currentPlayer.id);
    if (existingBet) {
      existingBet.amount += amount;
      setBets([...bets]);
    } else {
      setBets([...bets, { playerId: currentPlayer.id, amount }]);
    }

    const updatedPlayers = players.map(p => 
      p.id === currentPlayer.id ? { ...p, balance: p.balance - amount } : p
    );
    setPlayers(updatedPlayers);
    
    setBetAmount('');
    toast.success(`Ставка ${amount} 🎁 принята!`);
  };

  const addBotBets = (playerBet: number) => {
    const botCount = Math.floor(Math.random() * 2) + 2;
    const newBets: Bet[] = [...bets];
    
    for (let i = 0; i < botCount; i++) {
      const botId = `bot-${Date.now()}-${i}`;
      const variation = 0.5 + Math.random();
      const botBetAmount = Math.floor(playerBet * variation);
      
      const botPlayer: Player = {
        id: botId,
        name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
        balance: 0,
        color: PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length],
        wins: 0,
        losses: 0
      };
      
      setPlayers(prev => [...prev, botPlayer]);
      newBets.push({ playerId: botId, amount: botBetAmount });
    }
    
    return newBets;
  };

  const spinWheel = () => {
    if (bets.length === 0) {
      toast.error('Сделайте ставку для начала игры');
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    
    let finalBets = bets;
    if (bets.length === 1) {
      const playerBet = bets[0].amount;
      finalBets = addBotBets(playerBet);
      setBets(finalBets);
      toast.info('К игре присоединились боты!');
    }

    const finalTotalPot = finalBets.reduce((sum, bet) => sum + bet.amount, 0);

    const random = Math.random() * finalTotalPot;
    let accumulated = 0;
    let selectedWinner: Player | null = null;

    for (const bet of finalBets) {
      accumulated += bet.amount;
      if (random <= accumulated) {
        selectedWinner = players.find(p => p.id === bet.playerId) || null;
        break;
      }
    }

    const spins = 5 + Math.random() * 3;
    const newRotation = rotation + spins * 360;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(selectedWinner);
      
      if (selectedWinner) {
        const updatedPlayers = players.map(p => {
          if (p.id === selectedWinner.id) {
            return { ...p, balance: p.balance + finalTotalPot, wins: p.wins + 1 };
          } else if (finalBets.find(b => b.playerId === p.id)) {
            return { ...p, losses: p.losses + 1 };
          }
          return p;
        });
        
        const cleanedPlayers = updatedPlayers.filter(p => !p.id.startsWith('bot-'));
        setPlayers(cleanedPlayers);

        const round: Round = {
          id: history.length + 1,
          winner: selectedWinner.name,
          totalPot: finalTotalPot,
          timestamp: new Date().toLocaleTimeString('ru-RU'),
          participants: finalBets.length
        };
        setHistory([round, ...history]);

        toast.success(`${selectedWinner.name} выиграл ${finalTotalPot} 🎁!`, {
          duration: 5000
        });
      }

      setBets([]);
    }, 4000);
  };

  const renderWheel = () => {
    if (bets.length === 0) {
      return (
        <div className="w-80 h-80 rounded-full bg-gradient-to-br from-muted to-card border-4 border-primary/30 flex items-center justify-center">
          <p className="text-muted-foreground text-center px-8">Сделайте ставку<br/>для начала игры</p>
        </div>
      );
    }

    let currentAngle = 0;
    const segments = bets.map(bet => {
      const player = players.find(p => p.id === bet.playerId);
      const angle = (bet.amount / totalPot) * 360;
      const segment = {
        player,
        startAngle: currentAngle,
        angle,
        color: player?.color || '#666'
      };
      currentAngle += angle;
      return segment;
    });

    return (
      <div className="relative">
        <div 
          className="w-80 h-80 rounded-full border-4 border-primary shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] ease-out"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.4)'
          }}
        >
          <svg width="320" height="320" viewBox="0 0 320 320" className="absolute inset-0">
            {segments.map((segment, idx) => {
              const startAngle = (segment.startAngle - 90) * (Math.PI / 180);
              const endAngle = ((segment.startAngle + segment.angle) - 90) * (Math.PI / 180);
              const largeArc = segment.angle > 180 ? 1 : 0;

              const x1 = 160 + 160 * Math.cos(startAngle);
              const y1 = 160 + 160 * Math.sin(startAngle);
              const x2 = 160 + 160 * Math.cos(endAngle);
              const y2 = 160 + 160 * Math.sin(endAngle);

              return (
                <path
                  key={idx}
                  d={`M 160 160 L ${x1} ${y1} A 160 160 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={segment.color}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-background border-4 border-primary shadow-lg flex items-center justify-center">
              <Icon name="Gift" size={24} className="text-primary" />
            </div>
          </div>
        </div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div 
            className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-primary drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            PvP Рулетка 🎁
          </h1>
          <p className="text-muted-foreground">Крути колесо и забирай призы!</p>
        </header>

        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="game" className="gap-2">
              <Icon name="Trophy" size={18} />
              Игра
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <Icon name="User" size={18} />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Icon name="History" size={18} />
              История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Users" size={24} />
                    Участники раунда
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {players.map(player => {
                    const bet = getPlayerBet(player.id);
                    const chance = getWinChance(player.id);
                    return (
                      <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Баланс: {player.balance} 🎁
                            </p>
                          </div>
                        </div>
                        {bet > 0 && (
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {bet} 🎁
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {chance.toFixed(1)}% шанс
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Сумма ставки"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          disabled={isSpinning}
                          className="flex-1"
                        />
                        <Button 
                          onClick={placeBet}
                          disabled={isSpinning}
                          className="gap-2"
                        >
                          <Icon name="Plus" size={18} />
                          Ставка
                        </Button>
                      </div>
                      <Button 
                        onClick={spinWheel}
                        disabled={isSpinning || bets.length === 0}
                        className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        size="lg"
                      >
                        <Icon name="Play" size={20} />
                        {isSpinning ? 'Крутится...' : 'Запустить рулетку!'}
                      </Button>
                    </div>
                  </div>

                  {totalPot > 0 && (
                    <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-muted-foreground">Общий банк</p>
                      <p className="text-3xl font-bold text-primary">{totalPot} 🎁</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex items-center justify-center animate-scale-in">
                <CardContent className="flex flex-col items-center gap-6 pt-6">
                  {renderWheel()}
                  {winner && (
                    <div className="text-center animate-scale-in p-6 bg-primary/10 rounded-xl border-2 border-primary">
                      <Icon name="Crown" size={48} className="text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{winner.name}</p>
                      <p className="text-muted-foreground">Победитель!</p>
                      <p className="text-xl font-bold text-primary mt-2">+{totalPot} 🎁</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="User" size={24} />
                  Профиль игрока
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                  <div 
                    className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
                    style={{ backgroundColor: currentPlayer.color }}
                  >
                    <Icon name="User" size={48} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">{currentPlayer.name}</h2>
                  <p className="text-5xl font-bold text-primary">{currentPlayer.balance} 🎁</p>
                  <p className="text-muted-foreground">Текущий баланс</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="text-center pt-6">
                      <Icon name="Trophy" size={32} className="text-green-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold">{currentPlayer.wins}</p>
                      <p className="text-sm text-muted-foreground">Побед</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="text-center pt-6">
                      <Icon name="X" size={32} className="text-red-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold">{currentPlayer.losses}</p>
                      <p className="text-sm text-muted-foreground">Проигрышей</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Винрейт</span>
                      <span className="text-xl font-bold">
                        {currentPlayer.wins + currentPlayer.losses > 0
                          ? ((currentPlayer.wins / (currentPlayer.wins + currentPlayer.losses)) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-muted-foreground">Всего игр</span>
                      <span className="text-xl font-bold">
                        {currentPlayer.wins + currentPlayer.losses}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="History" size={24} />
                  История раундов
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="Clock" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>История раундов пока пуста</p>
                    <p className="text-sm">Сыграйте первую игру!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map(round => (
                      <div 
                        key={round.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <Icon name="Crown" size={16} className="text-primary" />
                            {round.winner}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {round.participants} участников • {round.timestamp}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {round.totalPot} 🎁
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;