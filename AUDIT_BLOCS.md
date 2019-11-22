# Compte rendu de l'audit des contrats GCW Presale, Sale et Token
#### _Fait en novembre 2019, par [Jonathan "Blocs" Serra](https://blocs.fr/)_

# Introduction

Ce document passe en revu les trois contrats suivants :
- [GCWToken](contracts/GCWToken.sol) : Jeton de Gocoworker ;
- [GCWPreSale](contracts/GCWPreSale.sol) : Presale du jeton GCW ;
- [GCWSale](contracts/GCWSale.sol) : Vente périodique de jetons sur cycles de 21 heures ;

Toutes les vulnérabilités potentielles et les bonnes pratiques de code sont relevés par 3 marqueurs présents dans le code source des contrats en commentaires et dans les tests en de rares occasions :
- `MAJOR_x` où x est un nombre à 2 chiffres : Ce sont les parties qui ont un impact sur la logique du code ;
- `MEDIUM_x` où x est un nombre à 2 chiffres : Ce sont les parties qui nécessite une attention particulière ;
- `MINOR_x` où x est un nombre à 2 chiffres : Ce sont les parties qui peuvent être améliorées ;
- `WATCH_x` où x est un nombre à 2 chiffres : Ce sont tous les points où l'attention est demandée lorsque une curiosité est levée mais qu'il se peut que ce soit un choix de conception ;

# Sommaire

1. [Note d'attention](#1)
2. [Vue d'ensemble](#2)
3. [Attaques réalisées](#3)
4. [Majeur](#4)
5. [Medium](#5)
6. [Mineur](#6)
7. [Vigilance](#7)
8. [Conclusion](#8)

# 1. <a name="1"></a>Note d'attention

Cet audit ne concerne pas la viabilité du business autour des contrats concernés. Sont concernées la qualité de code des contrats ainsi que la sécurité. Cet audit est livré avec :
- Un document de compte rendu ;
- Le code source commenté pour les références ;
- Des mises à jour et ajout de tests unitaires ;

# 2. <a name="2"></a>Vue d'ensemble

Les contrats consistent en la vente de jetons ERC20, implémentés avec la librairie [OpenZeppelin Solidity](https://github.com/OpenZeppelin/openzeppelin-contracts). La vente se déroule en deux étapes.

#### _Presale_

Vente limitée en quantité et en temps de jetons GCW. Programme de parrainage pour associer un investisseur avec un filleul qui recevront tous deux une récompense de jetons lorsque l'investisseur achète des jetons.

#### _Sale_

Vente limitée en quantité et en temps de jetons GCW. La vente est quantifiée sur des intervales de temps de 21 heures renouvellé jusqu'à la fin de la vente.

Tous les jetons sont redistribués à des portefeuilles à la finalisation.

# 3. <a name="3"></a>Attaques réalisées

```
TODO
```

# 4. <a name="4"></a>Majeur

| Tag      | Contrat        | Commentaires  |
|----------|:--------------:|---------------|
| MAJOR_01 | GCWPreSale.sol | Présent à deux reprises. La mise à jour de la date de cloture et de fermeture de la vente peut permettre de mettre une date d'ouverture supérieure à la date de fermeture. Cela peut impacter la logique du contrat en cas d'erreur humaine.              |
| MAJOR_02 | GCWPreSale.sol | Un filleul peut être ajouté quand bien même le programme de parrainage est désactivé. Il se peut que ce soit une volonté, voir `WATCH_02`              |
| MAJOR_03 | GCWSale.sol    | `buyTokens` doit profiter de l'héritage OpenZeppelin afin de profiter un maximum des contrats audités. L'ordre est à revoir. La mise à jour des états `dailyTotals` et `userBuys` doit être lancée à la fin de la fonction, en `_postValidatePurchase`.  |

# 5. <a name="5"></a>Medium

| Tag       | Contrat(s)        | Commentaires  |
|-----------|:--------------:|---------------|
| MEDIUM_01 | GCWPreSale.sol | La fonction ne fait rien. |
| MEDIUM_02 | GCWPreSale.sol | `saleWallet` et `rewardPoolWallet` peuvent être identiques. |
| MEDIUM_03 (removed) | NA | NA |
| MEDIUM_04 | GCWPreSale.sol / GCWSale.sol | Doit respecter l'héritage |
| MEDIUM_05 | GCWPreSale.sol | Préférer l'usage d'un `require` plutôt qu'une condition pour reverser les gas. |
| MEDIUM_06 | GCWPreSale.sol | `require` manquant |
| MEDIUM_07 | GCWSale.sol    | Préférer l'usage d'un `require` plutôt qu'une condition pour reverser les gas. |
| MEDIUM_08 (déplacé) | GCWSale.sol    | Voir MAJOR_03 |
| MEDIUM_09 | GCWToken.sol   | `teamWallet`, `tokenSaleWallet` et `rewardPoolWallet` peuvent être identiques et 0. |

# 6. <a name="6"></a>Mineur

| Tag      | Contrat(s)                                     | Commentaires  |
|----------|:-------------------------------------------:|---------------|
| MINOR_01 | GCWPreSale.sol / GCWSale.sol / GCWToken.sol | Solidity pragma doit être une valeur fixe. Retirer le `^` et préférer une version à jour. |
| MINOR_02 (supprimé) | NA | NA |
| MINOR_03 | GCWPreSale.sol / GCWSale.sol | Inverser les conditions pour améliorer la lisibilité du code. |
| MINOR_04 | GCWPreSale.sol | Améliorer l'ordre des appels. |
| MINOR_05 | GCWPreSale.sol | Séparer le `require` en plusieurs `require`. |
| MINOR_06 | GCWPreSale.sol | Améliorer la condition. |
| MINOR_07 | GCWPreSale.sol | Ajouter un `require` pour éviter une consommation de GAS inutile. |
| MINOR_08 | GCWSale.sol | Ajout d'un `require` supplémentaire pour éviter les erreurs humaines. |
| MINOR_09 | GCWSale.sol | Fonction publique doit être précisément nommée et doit commencer par un verbe à l'infinitif (make, build, do, etc.). Convention de code "self documented" |
| MINOR_10 | GCWSale.sol | La variable devrait être constante pour améliorer la lisibilité du code. |
| MINOR_11 | GCWSale.sol | Eviter les instructions ternaires. |
| MINOR_12 | GCWSale.sol | Préférer l'appel à la fonction `token()`. |

# 7. <a name="7"></a>Vigilance

| Tag      | Contrat(s)        | Commentaires  |
|----------|:--------------:|---------------|
| WATCH_01 | GCWPreSale.sol | Le code ne profite pas de l'héritage OpenZeppelin sans que la raison semble justifiée. |
| WATCH_02 | GCWPreSale.sol / GCWSale.sol | Logique de parrainage contre-intuitive pour l'utilisateur. Lorsqu'un utilisateur a un filleul, l'activation du parrainage est garrante de la distribution de la récompense. Cela pourrait amener de la confusion de point de vue des investisseurs. |
| WATCH_03 | GCWSale.sol | La fonction existe déjà par héritage. |

# 8. <a name="8"></a>Conclusion

Le code respecte en partie l'intégration des contrats audités OpenZeppelin. L'utilisation de SafeMath est présente à tous les calculs. Bon respect de l'encapsulation.

Les contrats OpenZeppelin sont audités par une communauté de professionnels. Dans cet audit ils n'ont pas été passés en revu.

**Le code doit être un peu plus commenté en particulier au niveau des fonctions publiques** pour une question d'ouverture du code et pour apporter plus de confiance au investisseurs connaisseurs.

_Dernière mise à jour le 22 novembre 2019_
